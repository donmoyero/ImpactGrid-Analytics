# ImpactGrid Analytics - main site

The public front door for ImpactGrid. Visitors read about the product here, then sign in or get started on the platform.

The business product itself (businesses, customers, staff, services, appointments, products, inventory, website management, settings) lives in a separate repository, `donmoyero/business-platform`, served at `platform.impactgridanalytics.com`.

```
impactgridanalytics.com            this repo: public marketing site
        |
  Sign in / Get started
        |
        v
platform.impactgridanalytics.com   business-platform repo: the SaaS product
        |
     Supabase                      shared source of truth
```

Main site = front door. Platform = product. Supabase = source of truth.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion and Supabase.

## What this site does

- Public pages: Home, About, Services, Support & FAQ, Contact.
- Contact form at `/api/contact`, sent through Resend. Without `RESEND_API_KEY` the Contact page shows a plain email link instead.
- Sign in at `/login` (see below). "Get started" links to the platform's login page.
- A small admin area at `/admin` with one tool: the Homepage Editor.

This site is not a business dashboard and has no customer accounts. Business users sign in here and are handed to the platform.

## Sign-in flow

1. `/login` signs the user in with email and password, or with Google.
2. `/auth/callback` exchanges the sign-in code (Google, email confirmation links) for a session.
3. `/auth/continue` decides where to go next:
   - users with `is_admin` set on their `profiles` row go to `/admin`
   - everyone else goes to the platform (`NEXT_PUBLIC_PLATFORM_URL`)

## Admin: Homepage Editor

`/admin/homepage` edits the homepage sections (order, text, links, images). Only users with `profiles.is_admin = true` can open `/admin`.

- Editor UI and save actions: `app/admin/homepage/`
- Default content and loading logic: `lib/site/content.ts`
- Saved content is stored in the `site_content` table in Supabase.

The platform has its own, separate admin at `platform.impactgridanalytics.com/admin`.

## Website suspension (middleware)

`middleware.ts` returns HTTP 503 for hostnames that belong to a suspended or maintenance-mode website, before any page runs. It asks Supabase through the `site_status_for_host` function and fails open if that lookup errors. This site's own hosts (localhost, `*.vercel.app`, `impactgridanalytics.com`, anything in `OWN_HOSTS`) are never checked.

It also refreshes the signed-in session on `/admin` pages.

Status: this logic still reads the old agency data. How hostname-based suspension works for business websites in the new architecture is an open decision, to be settled during database reconciliation.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access (admin checks, middleware lookup). Never expose it. |
| `NEXT_PUBLIC_PLATFORM_URL` | Where the platform lives. Defaults to `https://platform.impactgridanalytics.com`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_EMAIL` | Contact form email |
| `NEXT_PUBLIC_APP_URL` | This site's own URL |
| `OWN_HOSTS` | Optional. Extra hostnames the suspension check should skip (comma-separated). |

## Run it locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Type-check without building:

```bash
npx tsc --noEmit
```

## Project layout

```
app/          Pages and API routes (App Router): public pages, /login, /auth, /admin, /api/contact, /api/me
components/   Shared UI (nav, footer, home sections, admin nav, sign-out button)
lib/          Supabase clients, admin check, platform URLs, homepage content, utils
public/       Static assets
supabase/     SQL files (see below)
middleware.ts Suspension and maintenance enforcement, admin session refresh
```

## Database

Supabase is shared with the platform. The platform's schema is meant to become the canonical one for overlapping business functionality, so this site's old tables are being reconciled rather than extended.

The SQL files in `supabase/` are kept as a historical reference of the old agency schema, except `migrations-site-content.sql`, which relates to the Homepage Editor's content table. Do not run the old files against the shared database.

## Status

This repository is being consolidated into one coherent product. The old agency model (Stripe, payments, checkout, invoices, Care Plans, packages, project booking, the customer dashboard and the payment-reminder workflow) has been removed from the code. Its old database tables are untouched and will be handled during database reconciliation.

The previous README, which describes that old model, is available in the Git history.
