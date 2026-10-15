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
- Get started at `/get-started`: four full-screen steps (business, goals, name, create your account), then the platform sets the business up (see below).
- Sign in at `/login`, for people who already have an account (see below). Creating an account only happens through Get started.
- A small admin area at `/admin` with one tool: the Homepage Editor.

This site is not a business dashboard and has no customer accounts. Everyone signs in here and is handed to the platform.

## Get started and sign-in flow

This site is the single front door. People create an account or sign in here; the platform is where they work.

**New people: Get started** (`/get-started`)

1. Four steps, one page each: `/get-started` (business type), `/get-started/goal`, `/get-started/name`, `/get-started/account`. The answers travel in the address (`?type=...&goals=...&name=...`); nothing is stored on this site (`lib/onboarding.ts`).
2. The last step, `/get-started/account` ("Create Your Account"), is **sign-up only**: Google, or email + password. If the email already has an account it says so and links to Log in.
3. After sign-up, `/auth/continue` hands the person to the platform's `/start` page with their answers. The platform creates their business and opens the dashboard page for their first goal.

**Returning people: Sign in** (`/login`)

1. `/login` is **sign-in only** (Google, or email + password), in the same full-screen style as the Get started account step. It links to Get started for people without an account. Old `/login?mode=signup` links redirect to `/get-started`.
2. `/auth/callback` exchanges the sign-in code (Google, email confirmation links) for a session.
3. `/auth/continue` hands the person to the platform's `/auth/continue`, which sends platform admins to the platform `/admin` and everyone else to `/dashboard`.

The two pages share their buttons and styling through `components/auth/AuthParts.tsx`, so they stay identical.

`?next=` is accepted on `/login`, `/auth/callback` and `/auth/continue`, but only a path on this site or a URL on the platform (`safeDestination()` in `lib/platform.ts`). Anything else is ignored. The platform uses this to send signed-out people here and bring them back to the page they asked for (for example an invitation link).

Sign-out happens on the platform and returns to this site.

**Production requirements:** `NEXT_PUBLIC_COOKIE_DOMAIN=.impactgridanalytics.com` on both this project and the platform project, and this site's `/auth/callback` in Supabase's Auth redirect URL allow-list. Because `impactgridanalytics.com` redirects to `www.impactgridanalytics.com`, allow-list the `www` address (and `https://platform.impactgridanalytics.com/**`) too.

**If Get started ends in a 404:** the platform deployment is missing its `/start` page. Check that the platform's newest production deployment is Ready and built from the latest `main` (see "Deploying" below), and that `NEXT_PUBLIC_PLATFORM_URL` matches where the platform really lives.

## Admin: Homepage Editor

`/admin/homepage` edits the homepage sections (order, text, links, images). Only users with `profiles.is_admin = true` can open `/admin`.

- Editor UI and save actions: `app/admin/homepage/`
- Default content and loading logic: `lib/site/content.ts`
- Saved content is stored in the `site_content` table in Supabase.

The platform has its own, separate admin at `platform.impactgridanalytics.com/admin`.

## Middleware

`middleware.ts` only keeps the signed-in session fresh on `/admin`, `/login`, `/get-started/*` and `/auth/*`. Hostname-based suspension of business websites was removed with the old agency model (its database function no longer exists) and will be rebuilt on the platform's `businesses.status` when business subdomains are served.

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
app/          Pages and API routes (App Router): public pages, /get-started, /login, /auth, /admin, /api/contact, /api/me
components/   Shared UI (nav, footer, home sections, admin nav, sign-out button, auth/ shared sign-in parts)
lib/          Supabase clients, admin check, platform URLs, homepage content, utils
public/       Static assets
supabase/     SQL for the Homepage Editor's content table
middleware.ts Admin session refresh
```

## Database

This site uses the same Supabase project as the platform: one project, one source of truth. The platform's schema is canonical for everything business-related.

The only SQL file here is `supabase/migrations-site-content.sql`, which creates the `site_content` table and the `site-media` storage bucket used by the Homepage Editor. The old agency SQL files were removed; they are available in Git history.

## Deploying (read this first if a deployment says "Blocked")

**Pushing to GitHub does not reliably deploy this project.** Vercel may block the deployment with a message like
`ogtinzplayandearn-1822 is not a member of this team`. The cause: the GitHub login `donmoyero` is linked to a
different Vercel account (`ogtinzplayandearn-1822`, used for the ImpactGrid events project), and a GitHub account
can only be linked to one Vercel account. Vercel sees every push as coming from an account that is not in the
`donmoyero's projects` team, so it blocks it. An empty commit or a pull request does not fix this.

**How to deploy: from this folder, with the Vercel CLI**

```
vercel whoami
vercel --prod
```

- `vercel whoami` must print `donmoyero` (team `donmoyero's projects`). If it prints anything else, run
  `vercel logout`, then `vercel login` and choose **email** (not "Continue with GitHub", which signs in as the wrong account).
- First time in a folder only: `vercel link` (scope `donmoyero's projects`, existing project `impact-grid-analytics`).
- The CLI uploads the local files and builds them on Vercel with the environment variables already saved in the project.
  Deploy from the `main` branch with a clean `git status`, so production matches what is on GitHub.

**Things to remember**

- The dashboard's **Redeploy** button re-runs an OLD build. It does not deploy new code, so a green "Redeploy of ..." row does not mean your latest changes are live.
- A **Blocked** row after a push is expected until the account link is fixed. It is not a problem with the code.
- The main site (`ImpactGrid-Analytics`) and the platform (`business-platform`) deploy separately. After changing sign-in or
  Get started, deploy both.
- `vercel link` creates `.env.local` (already git-ignored). Never commit it.
- "Deployment Protection" notes in the CLI output apply to the long `*.vercel.app` addresses, not the custom domains.

**Permanent fix (when convenient):** move the events project to the `donmoyero` Vercel account, then link GitHub to that
account. After that, normal pushes deploy automatically and this section can be shortened.

## Status

This repository is being consolidated into one coherent product. The old agency model (Stripe, payments, checkout, invoices, Care Plans, packages, project booking, the customer dashboard and the payment-reminder workflow) has been removed from the code, and its old database tables and SQL files are gone.

The previous README, which describes that old model, is available in the Git history.
