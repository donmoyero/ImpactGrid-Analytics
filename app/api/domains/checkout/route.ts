import { NextRequest, NextResponse } from "next/server";
import { searchConfigured, quoteDomain } from "@/lib/domains/namesilo";
import { checkoutParams, singleDomain } from "@/lib/domains/checkout";

export const dynamic = "force-dynamic";

// Small per-instance limiter (same idea as search) so checkout sessions can't be spammed.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 10;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !searchConfigured()) return NextResponse.json({ error: "Checkout isn't available yet. Please check back soon." }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { body = null; }
  const one = singleDomain((body as { domain?: unknown } | null)?.domain);
  if (!one.ok) return NextResponse.json({ error: one.error }, { status: 400 });

  try {
    // The price is looked up here, again, at the moment of purchase. Nothing the browser sends can change it.
    const quote = await quoteDomain(one.domain);
    if (!quote) return NextResponse.json({ error: "Sorry, that domain isn't available any more." }, { status: 409 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: checkoutParams(quote.domain, quote.price, appUrl),
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      console.error("stripe checkout failed:", res.status, json.error?.message);
      return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ url: json.url });
  } catch (e) {
    console.error("domain checkout failed:", e);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
