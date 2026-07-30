# Stripe

The active Stripe integration lives in:
- `lib/stripe.ts` — server-side Stripe client
- `app/api/checkout/route.ts` — creates a Checkout Session for a package + add-ons
- `app/api/webhooks/stripe/route.ts` — handles `checkout.session.completed` and
  runs the automation chain (create client → create project → record payment)

This folder is a place to add anything Stripe-specific that doesn't belong in
`lib/` or `app/api/` — e.g. subscription helpers for recurring hosting/maintenance,
or scripts for syncing products/prices from your Stripe dashboard.

Point Stripe's webhook endpoint at:
`https://yourdomain.com/api/webhooks/stripe`

and set `STRIPE_WEBHOOK_SECRET` in your environment to the signing secret
Stripe gives you for that endpoint.
