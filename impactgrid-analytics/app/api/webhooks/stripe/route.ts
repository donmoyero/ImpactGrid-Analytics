import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * The automation chain described in the product spec:
 * payment succeeds -> create client -> create project -> send invoice
 * -> send welcome email -> notify admin -> create task board.
 *
 * Each TODO below is a placeholder for wiring your existing Resend /
 * invoicing / task-board services on Render — the shape of the data
 * being passed is already set up for you.
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createServiceRoleClient();

    const { packageId, businessName, domain } = session.metadata ?? {};

    // 1. Create / upsert client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        business_name: businessName || "New client",
        contact_email: session.customer_email,
      })
      .select()
      .single();

    if (clientError) {
      console.error("Failed to create client:", clientError);
      return NextResponse.json({ error: "Client creation failed" }, { status: 500 });
    }

    // 2. Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: client.id,
        business_name: businessName || "New client",
        package: packageId,
        domain: domain || null,
        stage: "planning",
        payment_status: "paid",
      })
      .select()
      .single();

    if (projectError) {
      console.error("Failed to create project:", projectError);
      return NextResponse.json({ error: "Project creation failed" }, { status: 500 });
    }

    // 3. Record payment
    await supabase.from("payments").insert({
      project_id: project.id,
      client_id: client.id,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency,
      stripe_session_id: session.id,
      status: "paid",
    });

    // 4. TODO: send invoice via your invoicing service
    // 5. TODO: send welcome email via Resend
    // 6. TODO: notify admin (email / Slack)
    // 7. TODO: create default task board rows in `tasks`

    return NextResponse.json({ received: true, projectId: project.id });
  }

  return NextResponse.json({ received: true });
}
