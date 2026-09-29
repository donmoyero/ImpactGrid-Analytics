# ImpactGrid Analytics

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

## 4. Billing: bank transfer build + Stripe Care Plan

- The **website build** is invoiced by **bank transfer** (not through Stripe).
- The **Care Plan** (hosting, SSL, backups, updates) is a **Stripe subscription**: the customer
  registers a card and agrees to a yearly debit. The **first year is free** (a 365-day trial), then
  Stripe charges the card once a year. Yearly prices per package are `carePlanYearly` in
  `lib/packages.ts` (and mirrored in the API's `lib/catalog.js`).
- Point a webhook at `/api/webhooks/stripe` (locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
  and set `STRIPE_WEBHOOK_SECRET`. Events to send: `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- On card registration the webhook creates the client, project (build `payment_status = pending`) and order,
  and emails you (via Resend, if set) to raise the build invoice. Mark the project paid once the transfer lands.
- Existing database? Run `supabase/migrations-care-plan.sql` once.
- Existing database? Then also run `supabase/migrations-operations.sql` once (safe to re-run). It adds the payment and
  Care Plan lifecycle: `care_plans`, `invoices` (with a state machine and `IGA-YYYY-NNNNN` numbering), `payment_reminders`,
  `websites` + `website_events` (audit log), `business_settings` (bank details for invoices), and the full domain statuses.
  New installs get all of this from `schema.sql`.
- `care_plans` is the source of truth for the Care Plan. `projects.care_plan_*` columns are read-only mirrors kept in sync by a trigger.
- In Stripe: Settings > Billing > Subscriptions and emails, turn on the trial-ending reminder email.

## 5b. Invoices (bank-transfer build fee)

One-time setup, in order:
1. `npm install pdf-lib` and `npm install -D tsx`
2. Supabase SQL editor: run `supabase/migrations-invoicing.sql` (new installs get it from `schema.sql`).
3. Copy `supabase/business-settings.example.sql`, replace every `REPLACE:` value with your real bank details and address, and run it.
   Bank details are stored admin-only in `business_settings` and injected into each PDF. Invoices refuse to generate while they are missing or placeholders.

Then, from the project folder (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`):

```
npx tsx scripts/invoice.ts pending                    what still needs an invoice
npx tsx scripts/invoice.ts create "ABC Fashion"       issue an invoice (PDF saved to invoices-out\)
npx tsx scripts/invoice.ts pay IGA-2026-00001 400     record a bank transfer (partial payments supported)
npx tsx scripts/invoice.ts list
npx tsx scripts/invoice.ts pdf IGA-2026-00001         re-save the PDF
```

Recording the final payment marks the invoice paid, the project's build fee paid, and the order paid.

## 5. Run it

```bash
npm run dev
```

## What works

- Marketing pages: home, services, pricing, about, support, contact
- Contact form (needs `RESEND_API_KEY`; without it the page shows a plain email link)
- 7-step project booking flow, Stripe Care Plan checkout (free first year), success page
- Stripe webhook: on card registration, creates the client, project and order in Supabase, and tracks Care Plan status

## Removed until they're real

These were demo-only and have been removed so the site doesn't show anything untrue:
portfolio (invented clients), domain search (fake availability), client dashboard and
admin dashboard (demo data, no accounts), client login. Add them back when they are backed
by real data. The removed code is in your original upload / git history.

## Not built yet

Automatic build invoices and customer welcome emails (you currently get an admin email and send the invoice yourself), and a real domain registrar lookup.

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
