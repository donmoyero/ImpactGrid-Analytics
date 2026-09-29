-- ImpactGrid Analytics — core schema + operations layer (invoices, Care Plans, websites, audit)
-- Run against your existing Supabase project (SQL editor, or via CLI migration).
-- Extends auth.users with an admin flag and covers every entity in the spec:
-- users, clients, projects, domains, orders, payments, services, addons,
-- messages, appointments, files, tasks, notifications.

create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
create type project_stage as enum ('planning', 'design', 'development', 'testing', 'completed');
create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type task_status as enum ('todo', 'in_progress', 'done');

-- ---------- Profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Clients ----------
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null,
  contact_email text not null,
  contact_phone text,
  created_at timestamptz not null default now()
);

-- ---------- Services & Add-ons (catalog) ----------
create table if not exists public.services (
  id text primary key,
  name text not null,
  description text,
  base_price numeric(10,2)
);

create table if not exists public.addons (
  id text primary key,
  name text not null,
  description text,
  price numeric(10,2) not null
);

-- ---------- Projects ----------
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  business_name text not null,
  package text not null,
  domain text,
  stage project_stage not null default 'planning',
  progress jsonb not null default '{"planning":0,"design":0,"development":0,"testing":0,"completed":0}',
  deadline date,
  payment_status payment_status not null default 'pending', -- build fee, paid by bank transfer
  notes text,
  -- Care Plan: yearly Stripe subscription, first year free (trial)
  care_plan_status text,            -- trialing | active | past_due | cancelled | expired | suspended (mirror of care_plans)
  care_plan_trial_ends_at timestamptz,
  care_plan_price numeric(10,2),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now()
);

-- ---------- Domains ----------
create table if not exists public.domains (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  domain_name text not null,
  registrar text,
  status text not null default 'pending', -- see migrations section below for the full lifecycle
  purchase_price numeric(10,2),
  renews_at date,
  created_at timestamptz not null default now()
);

-- ---------- Orders ----------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  package text not null,
  addon_ids text[] default '{}',
  total numeric(10,2) not null,
  status text not null default 'pending', -- pending | paid | cancelled
  created_at timestamptz not null default now()
);

-- ---------- Payments ----------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'gbp',
  stripe_session_id text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- Messages ----------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- Appointments ----------
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  scheduled_for timestamptz not null,
  topic text,
  meeting_url text,
  created_at timestamptz not null default now()
);

-- ---------- Files ----------
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

-- ---------- Tasks ----------
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  status task_status not null default 'todo',
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now()
);

-- ---------- Notifications ----------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.domains enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.files enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- Admins (profiles.is_admin = true) can see everything.
-- Clients can only see rows tied to their own client_id.
-- Adjust `is_admin()` check below to match your admin flagging approach.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create policy "Admins full access to clients" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients read own record" on public.clients
  for select using (user_id = auth.uid());

create policy "Admins full access to projects" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients read own projects" on public.projects
  for select using (
    client_id in (select id from public.clients where user_id = auth.uid())
  );

create policy "Admins full access to domains" on public.domains
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients read own domains" on public.domains
  for select using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

create policy "Admins full access to messages" on public.messages
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Clients read own messages" on public.messages
  for select using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

-- Seed the catalog (safe to re-run)
insert into public.services (id, name, base_price) values
  ('business-website', 'Business website', 800),
  ('ecommerce-website', 'E-commerce website', 1500),
  ('booking-website', 'Booking website', 1500),
  ('restaurant-website', 'Restaurant website', 1500),
  ('salon-website', 'Hair salon website', 1500),
  ('ai-integration', 'AI integration', null),
  ('seo', 'SEO', 350),
  ('brand-identity', 'Brand identity', 450)
on conflict (id) do nothing;

insert into public.addons (id, name, description, price) values
  ('logo', 'Logo design', 'A custom logo with source files.', 250),
  ('branding', 'Brand identity', 'Colours, type, and a short brand guide.', 450),
  ('seo', 'SEO package', 'Keyword research and on-page optimisation.', 350),
  ('gbp', 'Google Business setup', 'Verified listing with photos and hours.', 120)
on conflict (id) do nothing;

-- =====================================================================
-- Operations layer (same content as migrations-operations.sql)
-- =====================================================================

-- ---------- Shared helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Business settings (bank details etc. — admin only, injected into invoices) ----------
create table if not exists public.business_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Domains: full status lifecycle ----------
update public.domains set status = 'registration_pending' where status = 'pending';
alter table public.domains alter column status set default 'searching';
alter table public.domains drop constraint if exists domains_status_check;
alter table public.domains add constraint domains_status_check check (
  status in ('searching','available','reserved','registration_pending','registered','renewal_due','expired','failed')
);

-- ---------- Care Plan ----------
-- care_plans is the source of truth. projects.care_plan_* columns are read-only mirrors kept in sync by trigger.
update public.projects set care_plan_status = 'cancelled' where care_plan_status = 'canceled';
alter table public.projects drop constraint if exists projects_care_plan_status_check;
alter table public.projects add constraint projects_care_plan_status_check check (
  care_plan_status is null
  or care_plan_status in ('trialing','active','past_due','cancelled','expired','suspended')
);
alter table public.projects add column if not exists care_plan_start_date date;
alter table public.projects add column if not exists care_plan_renewal_date date;

create table if not exists public.care_plans (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  plan text not null,                          -- package tier: starter | business | premium
  price numeric(10,2),                         -- yearly price in GBP
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','cancelled','expired','suspended')),
  started_at timestamptz not null default now(),
  trial_ends_at timestamptz,
  renewal_at timestamptz,
  grace_period_ends_at timestamptz,            -- set when payment fails; drives reminder -> maintenance
  cancelled_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.care_plans_before_write()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists care_plans_before_write on public.care_plans;
create trigger care_plans_before_write before insert or update on public.care_plans
  for each row execute function public.care_plans_before_write();

create or replace function public.sync_care_plan_to_project()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.projects set
    care_plan_status        = new.status,
    care_plan_price         = new.price,
    care_plan_start_date    = (new.started_at at time zone 'Europe/London')::date,
    care_plan_renewal_date  = (new.renewal_at at time zone 'Europe/London')::date,
    care_plan_trial_ends_at = new.trial_ends_at
  where id = new.project_id;
  return new;
end;
$$;

drop trigger if exists sync_care_plan_to_project on public.care_plans;
create trigger sync_care_plan_to_project after insert or update on public.care_plans
  for each row execute function public.sync_care_plan_to_project();

-- Backfill from existing projects (renewal date is the end of the free year until Stripe next updates it).
insert into public.care_plans (project_id, plan, price, status, started_at, trial_ends_at, renewal_at,
                               stripe_customer_id, stripe_subscription_id)
select p.id, p.package, p.care_plan_price, p.care_plan_status, p.created_at,
       p.care_plan_trial_ends_at, p.care_plan_trial_ends_at,
       p.stripe_customer_id, p.stripe_subscription_id
from public.projects p
where p.care_plan_status is not null
on conflict (project_id) do nothing;

-- ---------- Websites (live status + maintenance/suspension) ----------
create table if not exists public.websites (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  status text not null default 'building'
    check (status in ('building','live','maintenance','suspended')),
  maintenance_mode boolean not null default false,
  maintenance_reason text,
  maintenance_message text,
  live_url text,
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admins only ever set `status`; the derived columns can't drift out of step with it.
create or replace function public.websites_before_write()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.maintenance_mode := (new.status = 'maintenance');
  if new.status = 'suspended' then
    new.suspended_at := coalesce(new.suspended_at, now());
  else
    new.suspended_at := null;
    new.suspended_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists websites_before_write on public.websites;
create trigger websites_before_write before insert or update on public.websites
  for each row execute function public.websites_before_write();

-- ---------- Website audit history ----------
create table if not exists public.website_events (
  id uuid primary key default uuid_generate_v4(),
  website_id uuid not null references public.websites(id) on delete cascade,
  event text not null,                         -- e.g. status_changed, payment_marked_paid, website_restored
  performed_by uuid references auth.users(id) on delete set null,  -- null = system / service role
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists website_events_website_idx on public.website_events (website_id, created_at desc);

-- Status changes are logged by the database itself so no code path can forget to.
create or replace function public.websites_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.website_events (website_id, event, performed_by, metadata)
    values (new.id, 'website_created', auth.uid(), jsonb_build_object('status', new.status));
  elsif new.status is distinct from old.status then
    insert into public.website_events (website_id, event, performed_by, metadata)
    values (
      new.id, 'status_changed', auth.uid(),
      jsonb_build_object(
        'from', old.status, 'to', new.status,
        'reason', coalesce(new.suspended_reason, new.maintenance_reason)
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists websites_audit on public.websites;
create trigger websites_audit after insert or update on public.websites
  for each row execute function public.websites_audit();

-- ---------- Invoices ----------
create table if not exists public.invoice_counters (
  year int primary key,
  last_value int not null
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  invoice_number text unique,                  -- IGA-2026-00042, assigned automatically
  amount numeric(10,2) not null check (amount >= 0),
  amount_paid numeric(10,2) not null default 0 check (amount_paid >= 0),
  amount_due numeric(10,2) generated always as (amount - amount_paid) stored,
  currency text not null default 'gbp',
  status text not null default 'draft'
    check (status in ('draft','issued','partially_paid','overdue','paid','void')),
  reminder_stage smallint not null default 0 check (reminder_stage between 0 and 3), -- 0 none, 1, 2, 3 = final
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_paid_within_amount check (amount_paid <= amount)
);
create index if not exists invoices_client_idx on public.invoices (client_id);
create index if not exists invoices_status_due_idx on public.invoices (status, due_at);

create or replace function public.invoices_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y int := extract(year from now() at time zone 'Europe/London')::int;
  n int;
begin
  if new.invoice_number is null then
    insert into public.invoice_counters as c (year, last_value) values (y, 1)
    on conflict (year) do update set last_value = c.last_value + 1
    returning last_value into n;
    new.invoice_number := 'IGA-' || y || '-' || lpad(n::text, 5, '0');
  end if;
  if new.status <> 'draft' then
    new.issued_at := coalesce(new.issued_at, now());
    new.due_at := coalesce(new.due_at, new.issued_at + interval '7 days');
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_before_insert on public.invoices;
create trigger invoices_before_insert before insert on public.invoices
  for each row execute function public.invoices_before_insert();

-- The invoice state machine. Reminders (reminder_stage) run alongside status; they don't replace it.
--   draft -> issued -> partially_paid -> paid
--                 \-> overdue --------/    (overdue is set after the final reminder)
--   draft/issued/partially_paid/overdue -> void        paid and void are final
create or replace function public.invoices_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();

  if old.status in ('paid','void') and new.status is distinct from old.status then
    raise exception 'Invoice % is % and cannot change status', old.invoice_number, old.status;
  end if;
  if old.status <> 'draft' and new.amount is distinct from old.amount then
    raise exception 'Invoice % has been issued; its amount cannot change (void it and raise a new one)', old.invoice_number;
  end if;
  if new.invoice_number is distinct from old.invoice_number then
    raise exception 'Invoice numbers cannot be changed';
  end if;

  if new.amount_paid > new.amount then
    raise exception 'Payment of % exceeds invoice total of %', new.amount_paid, new.amount;
  end if;

  -- A payment on its own moves the status forward.
  if new.status = old.status
     and new.amount_paid is distinct from old.amount_paid
     and new.status in ('issued','partially_paid','overdue') then
    if new.amount_paid >= new.amount then
      new.status := 'paid';
    elsif new.amount_paid > 0 and new.status = 'issued' then
      new.status := 'partially_paid';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft'          and new.status in ('issued','void')) or
      (old.status = 'issued'         and new.status in ('partially_paid','overdue','paid','void')) or
      (old.status = 'partially_paid' and new.status in ('overdue','paid','void')) or
      (old.status = 'overdue'        and new.status in ('paid','void'))
    ) then
      raise exception 'Invalid invoice transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'issued' then
      new.issued_at := coalesce(new.issued_at, now());
      new.due_at := coalesce(new.due_at, new.issued_at + interval '7 days');
    elsif new.status = 'paid' then
      new.amount_paid := new.amount;   -- marking paid settles the balance
      new.paid_at := coalesce(new.paid_at, now());
    end if;
  end if;

  if new.reminder_stage < old.reminder_stage and new.status not in ('paid','void') then
    raise exception 'Reminder stage cannot go backwards';
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_before_update on public.invoices;
create trigger invoices_before_update before update on public.invoices
  for each row execute function public.invoices_before_update();

-- ---------- Payment reminders (invoice chain and Care Plan chain) ----------
create table if not exists public.payment_reminders (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  care_plan_id uuid references public.care_plans(id) on delete cascade,
  reminder_type text not null check (
    reminder_type in ('reminder_1','reminder_2','final_reminder','care_plan_reminder','care_plan_final')
  ),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_reminders_one_target check ((invoice_id is null) <> (care_plan_id is null))
);
-- One reminder of each type per invoice / Care Plan, so a repeated cron run can't double-send.
create unique index if not exists payment_reminders_invoice_type_uq
  on public.payment_reminders (invoice_id, reminder_type) where invoice_id is not null;
create unique index if not exists payment_reminders_care_plan_type_uq
  on public.payment_reminders (care_plan_id, reminder_type) where care_plan_id is not null;

-- ---------- Row Level Security ----------
alter table public.business_settings enable row level security;
alter table public.care_plans enable row level security;
alter table public.websites enable row level security;
alter table public.website_events enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_counters enable row level security;
alter table public.payment_reminders enable row level security;

drop policy if exists "Admins full access to business_settings" on public.business_settings;
create policy "Admins full access to business_settings" on public.business_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins full access to care_plans" on public.care_plans;
create policy "Admins full access to care_plans" on public.care_plans
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Clients read own care_plans" on public.care_plans;
create policy "Clients read own care_plans" on public.care_plans
  for select using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "Admins full access to websites" on public.websites;
create policy "Admins full access to websites" on public.websites
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Clients read own websites" on public.websites;
create policy "Clients read own websites" on public.websites
  for select using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.user_id = auth.uid()
    )
  );

drop policy if exists "Admins full access to website_events" on public.website_events;
create policy "Admins full access to website_events" on public.website_events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins full access to invoices" on public.invoices;
create policy "Admins full access to invoices" on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Clients read own issued invoices" on public.invoices;
create policy "Clients read own issued invoices" on public.invoices
  for select using (
    status <> 'draft'
    and client_id in (select id from public.clients where user_id = auth.uid())
  );

drop policy if exists "Admins full access to payment_reminders" on public.payment_reminders;
create policy "Admins full access to payment_reminders" on public.payment_reminders
  for all using (public.is_admin()) with check (public.is_admin());

-- invoice_counters has RLS on and no policies: only the security-definer numbering trigger can touch it.

-- =====================================================================
-- Invoice generation support (same content as migrations-invoicing.sql)
-- =====================================================================

-- Line items are stored on the invoice so the PDF always matches what was issued.
alter table public.invoices add column if not exists line_items jsonb not null default '[]'::jsonb;

-- Address printed under "Bill to" (optional).
alter table public.clients add column if not exists billing_address text;

-- Link bank-transfer payments to the invoice they settle.
alter table public.payments add column if not exists invoice_id uuid references public.invoices(id) on delete set null;
alter table public.payments add column if not exists method text;

-- Private bucket for generated invoice PDFs (accessed with the service role only).
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;
