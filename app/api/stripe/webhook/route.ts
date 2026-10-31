import { NextRequest, NextResponse } from "next/server";
import { registerDomain } from "@/lib/domains/namesilo";
import { parseDomainOrder, verifyStripeSignature } from "@/lib/domains/webhook";
import { notifyOwner } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Stripe calls this after a payment. For a paid domain order we register the domain with NameSilo.
 * 200 = handled (or nothing to do). 5xx = Stripe will retry later, which is what we want for temporary problems.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook isn't set up." }, { status: 503 });

  const raw = await req.text(); // must be the untouched body, or the signature check fails
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  let event: unknown;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad body." }, { status: 400 }); }

  const order = parseDomainOrder(event);
  if (!order) return NextResponse.json({ ok: true, ignored: true }); // not a paid domain order

  const who = `${order.email ?? "unknown email"} (Stripe session ${order.sessionId})`;
  try {
    const result = await registerDomain(order.domain);
    if (result === "taken") {
      console.error("paid domain no longer available:", order.domain, order.sessionId);
      await notifyOwner(`ACTION NEEDED: ${order.domain} was paid for but is no longer available`, `A customer paid for ${order.domain} but it could not be registered (it is taken, or it was already registered by an earlier attempt).\n\nCustomer: ${who}\n\nCheck NameSilo. If it isn't yours, refund the payment in Stripe.`);
      return NextResponse.json({ ok: true, registered: false });
    }
    await notifyOwner(`Domain registered: ${order.domain}`, `${order.domain} was paid for and registered for 1 year.\n\nCustomer: ${who}\n\nNext: connect it to their ShopPlug website.`);
    return NextResponse.json({ ok: true, registered: true });
  } catch (e) {
    console.error("domain registration failed:", order.domain, e);
    await notifyOwner(`ACTION NEEDED: registering ${order.domain} failed`, `A customer paid for ${order.domain} but registration failed: ${e instanceof Error ? e.message : String(e)}\n\nCustomer: ${who}\n\nStripe will retry automatically. Common cause: not enough NameSilo account balance.`);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
