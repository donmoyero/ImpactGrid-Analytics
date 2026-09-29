import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getPackage, addons, CARE_PLAN_TRIAL_DAYS } from "@/lib/packages";
import { formatGBP } from "@/lib/utils";

/**
 * Expects: { packageId, addonIds, businessName, domain, email, phone, notes, palette }
 *
 * The website build itself is invoiced by bank transfer — Stripe is NOT used
 * for it. Stripe is only used for the yearly Care Plan: this creates a
 * subscription Checkout Session with a free trial, so the customer registers a
 * card and agrees to a yearly debit but pays nothing today. Stripe charges the
 * card automatically when the trial ends, then every year.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageId, addonIds = [], businessName, domain, email, phone, notes, palette } = body;

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const pkg = getPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Unknown package selected." }, { status: 400 });
    }

    const validAddonIds: string[] = Array.isArray(addonIds) ? addonIds : [];
    const selectedAddons = addons.filter((a) => validAddonIds.includes(a.id));
    const buildTotal = pkg.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const metadata = {
      packageId,
      businessName: String(businessName ?? "").slice(0, 200),
      domain: String(domain ?? "").slice(0, 200),
      addonIds: selectedAddons.map((a) => a.id).join(","),
      buildTotal: String(buildTotal),
      carePlanYearly: String(pkg.carePlanYearly),
      phone: String(phone ?? "").slice(0, 60),
      palette: String(palette ?? "").slice(0, 60),
      notes: String(notes ?? "").slice(0, 300), // Stripe metadata values max 500 chars
    };

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      payment_method_collection: "always",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `ImpactGrid Analytics Care Plan — ${pkg.name}`,
              description: "Hosting, SSL, backups, monitoring, updates and small edits.",
            },
            unit_amount: pkg.carePlanYearly * 100,
            recurring: { interval: "year" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: CARE_PLAN_TRIAL_DAYS,
        metadata,
      },
      customer_email: email,
      metadata,
      custom_text: {
        submit: {
          message: `Your first year is free. By continuing you authorise ImpactGrid Analytics to charge this card ${formatGBP(pkg.carePlanYearly)} per year from the end of your free year, until you cancel. Your website build is invoiced separately by bank transfer.`,
        },
      },
      success_url: `${appUrl}/checkout/success`,
      cancel_url: `${appUrl}/checkout?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
