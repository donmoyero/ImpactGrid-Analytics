import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getPackage } from "@/lib/packages";
import type { CarePlanStatus } from "@/types";

/**
 * Stripe is only used for the yearly Care Plan (card on file, free first year).
 * The website build is invoiced by bank transfer, so this webhook creates the
 * client / project / order with payment_status = "pending" and you mark the
 * project "paid" yourself once the transfer lands.
 *
 * Events handled:
 *  - checkout.session.completed      card registered -> create client, project, order
 *  - customer.subscription.updated   keep care_plan_status in sync
 *  - customer.subscription.deleted   care plan cancelled
 *  - invoice.payment_failed          yearly charge failed -> past_due
 *
 * care_plans is the source of truth for the Care Plan lifecycle; projects.care_plan_* are mirrors.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || typeof session.subscription !== "string") break;

      const subscription = await getStripe().subscriptions.retrieve(session.subscription);
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
      const renewalAt = trialEnd ?? new Date(subscription.current_period_end * 1000).toISOString();

      // Stripe retries webhooks — never create the same project twice.
      const { data: existing } = await supabase
        .from("projects")
        .select("id, package")
        .eq("stripe_subscription_id", session.subscription)
        .maybeSingle();
      if (existing) {
        // Make sure a retry still leaves a Care Plan behind if the first attempt died before creating it.
        await upsertCarePlan(supabase, {
          projectId: existing.id,
          plan: existing.package,
          price: getPackage(existing.package)?.carePlanYearly ?? null,
          status: subscription.status === "trialing" ? "trialing" : "active",
          trialEnd,
          renewalAt,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId: session.subscription,
        });
        return NextResponse.json({ received: true, duplicate: true });
      }

      const { packageId, businessName, domain, phone, notes, palette, addonIds, buildTotal, carePlanYearly } =
        session.metadata ?? {};
      const email = session.customer_details?.email ?? session.customer_email;
      const name = businessName || "New client";

      // 1. Client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({ business_name: name, contact_email: email, contact_phone: phone || null })
        .select()
        .single();
      if (clientError) {
        console.error("Failed to create client:", clientError);
        return NextResponse.json({ error: "Client creation failed" }, { status: 500 });
      }

      // 2. Project (build fee unpaid until the bank transfer arrives)
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: client.id,
          business_name: name,
          package: packageId,
          domain: domain || null,
          stage: "planning",
          payment_status: "pending",
          notes: [palette && `Palette: ${palette}`, notes].filter(Boolean).join("\n") || null,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: session.subscription,
        })
        .select()
        .single();
      if (projectError) {
        console.error("Failed to create project:", projectError);
        return NextResponse.json({ error: "Project creation failed" }, { status: 500 });
      }

      // 3. Care Plan (source of truth; a trigger mirrors it onto projects.care_plan_*)
      await upsertCarePlan(supabase, {
        projectId: project.id,
        plan: packageId ?? "",
        price: Number(carePlanYearly) || getPackage(packageId ?? "")?.carePlanYearly || null,
        status: subscription.status === "trialing" ? "trialing" : "active",
        trialEnd,
        renewalAt,
        customerId: typeof session.customer === "string" ? session.customer : null,
        subscriptionId: session.subscription,
      });

      // 4. Order = the build invoice you need to raise
      await supabase.from("orders").insert({
        client_id: client.id,
        project_id: project.id,
        package: packageId,
        addon_ids: addonIds ? addonIds.split(",") : [],
        total: Number(buildTotal) || getPackage(packageId ?? "")?.price || 0,
        status: "pending",
      });

      // 5. Tell you there's a build invoice to send
      await notifyAdmin({
        subject: `New project: ${name} (${packageId}) — raise build invoice`,
        text:
          `${name} has registered a card for the Care Plan (first year free, ` +
          `then £${carePlanYearly}/yr from ${trialEnd ? trialEnd.slice(0, 10) : "the end of the trial"}).\n\n` +
          `Package: ${packageId}\nBuild total to invoice by bank transfer: £${buildTotal}\n` +
          `Add-ons: ${addonIds || "none"}\nEmail: ${email}\nPhone: ${phone || "-"}\nDomain: ${domain || "to be chosen"}\n\n` +
          `Send the invoice, then mark the project as paid when the transfer arrives.`,
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      // Never let Stripe overwrite states we set ourselves (suspended / expired).
      await supabase
        .from("care_plans")
        .update({
          status: mapStatus(sub.status),
          renewal_at: new Date(sub.current_period_end * 1000).toISOString(),
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        })
        .eq("stripe_subscription_id", sub.id)
        .not("status", "in", "(suspended,expired)");
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("care_plans").update({ status: "cancelled" }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (subId) {
        await supabase
          .from("care_plans")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subId)
          .not("status", "in", "(suspended,expired)");
        await notifyAdmin({
          subject: "Care Plan payment failed",
          text: `The yearly Care Plan charge failed for ${invoice.customer_email ?? "a customer"} (subscription ${subId}). Stripe will retry automatically.`,
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapStatus(status: Stripe.Subscription.Status): CarePlanStatus {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "canceled" || status === "incomplete_expired") return "cancelled";
  return "past_due"; // past_due, unpaid, incomplete, paused
}

async function upsertCarePlan(
  supabase: ReturnType<typeof createServiceRoleClient>,
  p: {
    projectId: string;
    plan: string;
    price: number | null;
    status: CarePlanStatus;
    trialEnd: string | null;
    renewalAt: string;
    customerId: string | null;
    subscriptionId: string;
  }
) {
  const { error } = await supabase.from("care_plans").upsert(
    {
      project_id: p.projectId,
      plan: p.plan,
      price: p.price,
      status: p.status,
      trial_ends_at: p.trialEnd,
      renewal_at: p.renewalAt,
      stripe_customer_id: p.customerId,
      stripe_subscription_id: p.subscriptionId,
    },
    { onConflict: "project_id", ignoreDuplicates: true }
  );
  if (error) console.error("Failed to create care plan:", error);
}

/** Email you via Resend if configured; otherwise just log. Never fails the webhook. */
async function notifyAdmin({ subject, text }: { subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !to || !from) {
    console.log(`[admin notice] ${subject}\n${text}`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `ImpactGrid Analytics <${from}>`, to: [to], subject, text }),
    });
  } catch (err) {
    console.error("Admin notification failed:", err);
  }
}
