-- Invoice generation support. Run once after migrations-operations.sql (safe to re-run).

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
