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
- Sign in / create an account at `/login` (see below). "Get started" and "Sign in" link here.
- A small admin area at `/admin` with one tool: the Homepage Editor.

This site is not a business dashboard and has no customer accounts. Everyone signs in here and is handed to the platform.

## Sign-in flow

This site is the single front door. People sign in or create an account here; the platform is where they work.

1. `/login` signs in or creates an account (email + password, or Google).
2. `/auth/callback` exchanges the sign-in code (Google, email confirmation links) for a session.
3. `/auth/continue` hands the person to the platform's `/auth/continue`, which sends platform admins to the platform `/admin` and everyone else to `/dashboard`.

`?next=` is accepted on `/login`, `/auth/callback` and `/auth/continue`, but only a path on this site or a URL on the platform (`safeDestination()` in `lib/platform.ts`). Anything else is ignored. The platform uses this to send signed-out people here and bring them back to the page they asked for (for example an invitation link).

Sign-out happens on the platform and returns to this site.

**Production requirements:** `NEXT_PUBLIC_COOKIE_DOMAIN=.impactgridanalytics.com` on both this project and the platform project, and this site's `/auth/callback` in Supabase's Auth redirect URL allow-list.

## Admin: Homepage Editor

`/admin/homepage` edits the homepage sections (order, text, links, images). Only users with `profiles.is_admin = true` can open `/admin`.

- Editor UI and save actions: `app/admin/homepage/`
- Default content and loading logic: `lib/site/content.ts`
- Saved content is stored in the `site_content` table in Supabase.

The platform has its own, separate admin at `platform.impactgridanalytics.com/admin`.

## Middleware

`middleware.ts` only keeps the signed-in session fresh on `/admin`, `/login` and `/auth/*`. Hostname-based suspension of business websites was removed with the old agency model (its database function no longer exists) and will be rebuilt on the platform's `businesses.status` when business subdomains are served.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access (admin checks, middleware lookup). Never expose it. |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | Production: `.impactgridanalytics.com` (same on the platform). Empty locally. |
| `NEXT_PUBLIC_PLATFORM_URL` | Where the platform lives. Defaults to `https://platform.impactgridanalytics.com`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_EMAIL` | Contact form email |
| `NEXT_PUBLIC_APP_URL` | This site's own URL |

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
supabase/     SQL for the Homepage Editor's content table
middleware.ts Admin session refresh
```

## Database

This site uses the same Supabase project as the platform: one project, one source of truth. The platform's schema is canonical for everything business-related.

The only SQL file here is `supabase/migrations-site-content.sql`, which creates the `site_content` table and the `site-media` storage bucket used by the Homepage Editor. The old agency SQL files were removed; they are available in Git history.

## Status

This repository is being consolidated into one coherent product. The old agency model (Stripe, payments, checkout, invoices, Care Plans, packages, project booking, the customer dashboard and the payment-reminder workflow) has been removed from the code, and its old database tables and SQL files are gone.

The previous README, which describes that old model, is available in the Git history.
