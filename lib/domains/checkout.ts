/**
 * Pure helpers for domain checkout: validating the domain a visitor wants to buy and building the Stripe Checkout Session
 * request. No network calls here. The price always comes from our own server-side quote, never from the browser.
 */
import { candidatesFor } from "./search";

/** Accepts exactly one fully-typed domain (e.g. "mybusiness.com"), or returns an error message. */
export function singleDomain(raw: unknown): { ok: true; domain: string; tld: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || !raw.includes(".")) return { ok: false, error: "Choose a domain to buy." };
  const r = candidatesFor(raw);
  if (!r.ok) return r;
  const first = r.candidates[0];
  if (first.domain !== raw.trim().toLowerCase()) return { ok: false, error: "Choose a domain to buy." };
  return { ok: true, domain: first.domain, tld: first.tld };
}

/** Stripe only allows letters, numbers, "-" and "_" in client_reference_id, so dots become underscores. */
export const referenceFor = (domain: string) => domain.replace(/\./g, "_");

/** Form fields for POST https://api.stripe.com/v1/checkout/sessions. Price is in US dollars to match what the site shows. */
export function checkoutParams(domain: string, price: number, appUrl: string): URLSearchParams {
  const base = appUrl.replace(/\/+$/, "");
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "usd");
  p.set("line_items[0][price_data][unit_amount]", String(Math.round(price * 100)));
  p.set("line_items[0][price_data][product_data][name]", `Domain registration: ${domain}`);
  p.set("line_items[0][price_data][product_data][description]", "1-year registration");
  p.set("client_reference_id", referenceFor(domain));
  p.set("metadata[domain]", domain);
  p.set("payment_intent_data[metadata][domain]", domain);
  p.set("success_url", `${base}/domains?paid=1`);
  p.set("cancel_url", `${base}/domains`);
  return p;
}
