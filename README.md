# ImpactGrid Digital

A done-for-you website studio platform: customers search a domain, pick a
package, pay online, then track the build in a client dashboard while your
team manages everything from an admin dashboard.

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

## What's wired up vs. stubbed

**Wired up:**
- Full page flow: landing → services → pricing → domain search → book-project
  (7-step flow) → Stripe Checkout → client dashboard
- Supabase auth (email/password) on `/login`
- Stripe Checkout session creation (`app/api/checkout/route.ts`)
- Stripe webhook that creates a client + project + payment record on
  successful payment
- Full DB schema with RLS

**Stubbed — replace with your own integration when ready:**
- `app/api/domains/search/route.ts` returns demo availability data. Swap in a
  real call to OpenSRS / ResellerClub / OpenProvider using
  `DOMAIN_REGISTRAR_API_URL` / `DOMAIN_REGISTRAR_API_KEY`.
- `emails/README.md` — welcome email, invoice, admin notification, and
  project-update templates aren't built yet. Trigger them from the `TODO`
  comments in the Stripe webhook route using Resend.
- The client dashboard (`app/dashboard/page.tsx`) and admin dashboard
  (`app/admin/page.tsx`) currently render demo data so the UI is complete —
  swap in real Supabase queries scoped to the signed-in user once auth
  middleware is in place.
- AI Website Assistant, AI Quote Generator, AI Project Manager (future
  features from the spec) aren't started — `OPENAI_API_KEY` is reserved for
  these.

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
