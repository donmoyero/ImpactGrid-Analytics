-- ImpactGrid Digital — core schema
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
  payment_status payment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- Domains ----------
create table if not exists public.domains (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  domain_name text not null,
  registrar text,
  status text not null default 'pending', -- pending | reserved | registered | failed
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
  ('hosting', 'Hosting (annual)', 'Managed hosting, SSL, and backups.', 180),
  ('maintenance', 'Maintenance (monthly)', 'Updates, monitoring, and small edits.', 60),
  ('gbp', 'Google Business setup', 'Verified listing with photos and hours.', 120)
on conflict (id) do nothing;
