"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getPackage, CARE_PLAN_TRIAL_DAYS } from "@/lib/packages";
import { adminEmail, sendEmail } from "@/lib/email";

const UUID = /^[0-9a-f-]{36}$/i;
const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string).trim() : "");
const SIGN = "Thank you,\nImpactGrid Analytics\nhello@impactgridanalytics.com";

/** Runs an action, then returns to the bookings list with a message. redirect() must sit outside try/catch. */
async function run(fn: () => Promise<string>): Promise<never> {
  let ok = true;
  let msg: string;
  try {
    msg = await fn();
  } catch (e) {
    ok = false;
    msg = e instanceof Error ? e.message : "Something went wrong.";
  }
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  redirect(`/admin/bookings?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);
}

/**
 * Approve a booking request: creates the client (or reuses one with the same email), project, build order,
 * Care Plan record (free first year) and website record, then emails the customer.
 */
export async function approveBookingAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  await run(async () => {
    if (!UUID.test(id)) throw new Error("Invalid request.");
    const db = getAdminDb();

    // Claim it first so a double click can't create two projects.
    const { data: b, error: claimErr } = await db
      .from("booking_requests")
      .update({ status: "approved", decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (claimErr) throw new Error(claimErr.message);
    if (!b) throw new Error("That request has already been handled.");

    let projectId: string | null = null;
    let createdClientId: string | null = null;
    try {
      // Client: reuse an existing one with the same email (a returning customer keeps their login link).
      const { data: existing } = await db
        .from("clients")
        .select("id, user_id")
        .ilike("contact_email", b.contact_email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      let clientId: string;
      let linked = !!existing?.user_id;
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: c, error } = await db
          .from("clients")
          .insert({ business_name: b.business_name, contact_email: b.contact_email, contact_phone: b.contact_phone })
          .select("id")
          .single();
        if (error) throw new Error(`Couldn't create the client: ${error.message}`);
        clientId = c.id;
        createdClientId = c.id;
      }

      const { data: p, error: pErr } = await db
        .from("projects")
        .insert({
          client_id: clientId,
          business_name: b.business_name,
          package: b.package,
          domain: b.domain,
          stage: "planning",
          payment_status: "pending",
          notes: [b.palette && `Palette: ${b.palette}`, b.notes].filter(Boolean).join("\n") || null,
        })
        .select("id")
        .single();
      if (pErr) throw new Error(`Couldn't create the project: ${pErr.message}`);
      projectId = p.id;

      const { error: oErr } = await db.from("orders").insert({
        client_id: clientId,
        project_id: projectId,
        package: b.package,
        addon_ids: b.addon_ids ?? [],
        total: b.total,
        status: "pending",
      });
      if (oErr) throw new Error(`Couldn't create the order: ${oErr.message}`);

      const yearEnd = new Date(Date.now() + CARE_PLAN_TRIAL_DAYS * 86_400_000).toISOString();
      const { error: cpErr } = await db.from("care_plans").insert({
        project_id: projectId,
        plan: b.package,
        price: getPackage(b.package)?.carePlanYearly ?? null,
        status: "trialing",
        trial_ends_at: yearEnd,
        renewal_at: yearEnd,
      });
      if (cpErr) throw new Error(`Couldn't create the Care Plan: ${cpErr.message}`);

      const { error: wErr } = await db.from("websites").insert({ project_id: projectId, status: "building" });
      if (wErr) throw new Error(`Couldn't create the website record: ${wErr.message}`);

      // If they already have a confirmed account with this email, connect it now so they can just sign in.
      if (!linked) {
        const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const u = users?.users.find((x) => x.email?.toLowerCase() === b.contact_email.toLowerCase() && x.email_confirmed_at);
        if (u) {
          await db.from("clients").update({ user_id: u.id }).eq("id", clientId).is("user_id", null);
          linked = true;
        }
      }

      const { error: bErr } = await db.from("booking_requests").update({ client_id: clientId, project_id: projectId }).eq("id", id);
      if (bErr) console.error("Booking approved but link-back failed:", bErr.message);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const pkgName = getPackage(b.package)?.name ?? b.package;
      const access = linked
        ? `Sign in here to see your project: ${appUrl}/login`
        : `To see your project, go to ${appUrl}/login, choose "Create account" and use this same email address (${b.contact_email}). Confirm your email from the message we send, and your project will appear in your dashboard.`;
      await sendEmail({
        to: b.contact_email,
        replyTo: adminEmail(),
        subject: "Your website request is approved",
        text:
          `Hi ${b.business_name},\n\nGood news: your ${pkgName} website request is approved and we're getting started.\n\n${access}\n\n` +
          `We'll email your invoice for the website build separately, with our bank details. Your first year of the Care Plan is free.\n\n${SIGN}`,
      });

      return `Approved. ${b.business_name} now has a project, and they've been emailed${linked ? " (account already linked)" : " with a link to create their account"}.`;
    } catch (e) {
      // Undo, so it goes back to pending and can be tried again.
      if (projectId) await db.from("projects").delete().eq("id", projectId);
      if (createdClientId) await db.from("clients").delete().eq("id", createdClientId);
      await db.from("booking_requests").update({ status: "pending", decided_at: null, client_id: null, project_id: null }).eq("id", id);
      throw e;
    }
  });
}

export async function declineBookingAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const reason = str(formData, "reason").slice(0, 1000);
  await run(async () => {
    if (!UUID.test(id)) throw new Error("Invalid request.");
    const db = getAdminDb();
    const { data: b, error } = await db
      .from("booking_requests")
      .update({ status: "declined", decline_reason: reason || null, decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .select("business_name, contact_email")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!b) throw new Error("That request has already been handled.");

    await sendEmail({
      to: b.contact_email,
      replyTo: adminEmail(),
      subject: "About your website request",
      text:
        `Hi ${b.business_name},\n\nThanks for your request. Unfortunately we can't take it on as it stands.` +
        `${reason ? `\n\n${reason}` : ""}\n\nIf you'd like to talk it through, just reply to this email.\n\n${SIGN}`,
    });
    return `Declined. ${b.business_name} has been emailed.`;
  });
}
