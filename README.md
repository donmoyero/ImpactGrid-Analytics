# ImpactGrid Digital

A done-for-you website studio platform: customers pick a
package, pay online, then your team builds the site.

Built with Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion,
Supabase (auth/DB), and Stripe (payments).

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your **existing** Supabase and
Stripe project keys (both already set up on your side):

```bash
cp .env.example .env.local
```

Required to run locally:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Everything else (Cloudinary, Resend, Google, OpenAI, domain registrar, your
Render API base) is optional until you wire up that feature — the app runs
fine without them.

## 3. Database

Run `supabase/schema.sql` against your Supabase project (SQL editor, or via
the CLI). It creates every table from the spec — `clients`, `projects`,
`domains`, `orders`, `payments`, `services`, `addons`, `messages`,
`appointments`, `files`, `tasks`, `notifications` — plus a `profiles` table
with an `is_admin` flag and Row Level Security policies so clients only see
their own data while admins see everything.

If you already have some of these tables from another project, review the
script before running it — it uses `create table if not exists`, so it won't
overwrite existing tables, but check column names line up.

## 4. Stripe webhook

Point a webhook endpoint at `/api/webhooks/stripe` (locally, use the Stripe
CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`) and set
`STRIPE_WEBHOOK_SECRET` to the signing secret it gives you. This is what
triggers the "payment succeeds → create client → create project → record
payment" chain in `app/api/webhooks/stripe/route.ts`.

## 5. Run it

```bash
npm run dev
```

## What works

- Marketing pages: home, services, pricing, about, support, contact
- Contact form (needs `RESEND_API_KEY`; without it the page shows a plain email link)
- 7-step project booking flow, Stripe Checkout, success page
- Stripe webhook: on payment, creates the client, project, and payment record in Supabase

## Removed until they're real

These were demo-only and have been removed so the site doesn't show anything untrue:
portfolio (invented clients), domain search (fake availability), client dashboard and
admin dashboard (demo data, no accounts), client login. Add them back when they are backed
by real data. The removed code is in your original upload / git history.

## Not built yet

Welcome/invoice emails (see TODOs in the webhook route), and a real domain registrar lookup.

## Folder structure

```
app/            Pages and API routes (App Router)
components/     Shared UI components
lib/            Supabase clients, Stripe client, pricing data, utils
hooks/          Client-side React hooks
types/          Shared TypeScript types
supabase/       Database schema (schema.sql)
emails/         Email template notes (Resend)
stripe/         Stripe integration notes
```
