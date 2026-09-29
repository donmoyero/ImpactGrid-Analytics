-- Run once on an EXISTING database (new installs already get this from schema.sql).
-- Care Plan: yearly Stripe subscription, first year free.

alter table public.projects add column if not exists care_plan_status text;
alter table public.projects add column if not exists care_plan_trial_ends_at timestamptz;
alter table public.projects add column if not exists care_plan_price numeric(10,2);
alter table public.projects add column if not exists stripe_customer_id text;
alter table public.projects add column if not exists stripe_subscription_id text unique;

-- Hosting and maintenance are now covered by the Care Plan, not sold as add-ons.
delete from public.addons where id in ('hosting', 'maintenance');
