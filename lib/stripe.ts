import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazily creates the Stripe client on first use, so `next build` never
 * fails just because STRIPE_SECRET_KEY isn't set yet in this environment.
 * Set STRIPE_SECRET_KEY before actually calling checkout/webhook routes.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}
