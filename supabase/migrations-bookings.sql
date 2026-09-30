-- ImpactGrid Analytics — booking requests (customer asks, admin approves).
-- Safe to re-run. Run once in the Supabase SQL editor.
--
-- A customer's request lives here until you approve it. Approving creates the client, project, build order
-- and Care Plan record (free first year) and emails the customer. Declining just emails them.
-- Row Level Security is ON with no policies, so only the server (service role) can read or write this table.

create table if not exists public.booking_requests (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  contact_email text not null,
  contact_phone text,
  package text not null,
  addon_ids text[] not null default '{}',
  domain text,
  palette text,
  notes text,
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decline_reason text,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists booking_requests_status_idx on public.booking_requests (status, created_at desc);
create index if not exists booking_requests_email_idx on public.booking_requests (lower(contact_email), created_at desc);

alter table public.booking_requests enable row level security;
