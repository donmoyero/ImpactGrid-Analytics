import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getPackage, addons } from "@/lib/packages";

/**
 * Expects: { packageId, addonIds, businessName, domain, email }
 * Creates a Stripe Checkout Session for the one-time website build fee.
 * Recurring items (hosting/maintenance) can be added as a second
 * subscription Checkout Session, or as subscription line items here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageId, addonIds = [], businessName, domain, email } = body;

    const pkg = getPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Unknown package selected." }, { status: 400 });
    }

    const selectedAddons = addons.filter((a) => addonIds.includes(a.id));

    const line_items: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${pkg.name} website package`,
            description: pkg.tagline,
          },
          unit_amount: pkg.price * 100,
        },
        quantity: 1,
      },
      ...selectedAddons.map((a) => ({
        price_data: {
          currency: "gbp",
          product_data: { name: a.name, description: a.description },
          unit_amount: a.price * 100,
        },
        quantity: 1,
      })),
    ];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      customer_email: email,
      metadata: {
        packageId,
        businessName: businessName ?? "",
        domain: domain ?? "",
        addonIds: addonIds.join(","),
      },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/checkout?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
