-- Payment suspension system. Run once after migrations-operations.sql (safe to re-run).
--
--   invoice: issued -> partially_paid -> [reminder 1 -> reminder 2 -> final reminder] -> overdue
--   admin queue: overdue invoice => "SUSPEND WEBSITE"  ->  websites.status = 'suspended'
--   full payment (or void) of the invoice that caused the suspension => website goes live again
--
-- The database is the source of truth. Enforcement happens in middleware.ts / GET /api/site-status,
-- which read websites.status through site_status_for_host(); nothing here relies on the frontend.

-- ---------- Columns ----------
alter table public.websites
  add column if not exists suspended_for_invoice_id uuid references public.invoices(id) on delete set null;

alter table public.payment_reminders
  add column if not exists attempted_at timestamptz;   -- lets a crashed/failed send be retried safely

-- Keep derived suspension columns in step with status (replaces the version in migrations-operations.sql).
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
    new.suspended_for_invoice_id := null;
  end if;
  return new;
end;
$$;

-- ---------- Suspend (admin action) ----------
-- Only allowed once the project has an OVERDUE invoice, unless p_force is set.
create or replace function public.suspend_website(
  p_project_id uuid,
  p_reason text default null,
  p_force boolean default false
) returns public.websites
language plpgsql security definer set search_path = public as $$
declare
  v_inv uuid;
  v_site public.websites;
begin
  select id into v_inv
  from public.invoices
  where project_id = p_project_id and status = 'overdue'
  order by due_at
  limit 1;

  if v_inv is null and not p_force then
    raise exception 'No overdue invoice for this project. Suspension is only available once payment is overdue (use force to override).';
  end if;

  insert into public.websites (project_id, status, suspended_reason, suspended_for_invoice_id)
  values (
    p_project_id, 'suspended',
    coalesce(nullif(trim(p_reason), ''), case when v_inv is not null then 'Payment overdue' else 'Suspended by admin' end),
    v_inv
  )
  on conflict (project_id) do update
    set status = 'suspended',
        suspended_reason = excluded.suspended_reason,
        suspended_for_invoice_id = excluded.suspended_for_invoice_id
  returning * into v_site;

  return v_site;
end;
$$;

-- ---------- Automatic restore when the overdue invoice is settled ----------
create or replace function public.invoices_release_suspension()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_other uuid;
begin
  if new.status in ('paid', 'void') and old.status is distinct from new.status and new.project_id is not null then
    select id into v_other
    from public.invoices
    where project_id = new.project_id and status = 'overdue' and id <> new.id
    order by due_at
    limit 1;

    if v_other is null then
      update public.websites set status = 'live'
      where project_id = new.project_id and status = 'suspended' and suspended_for_invoice_id = new.id;
    else
      -- Another invoice is still overdue: stay suspended, but now on account of that one.
      update public.websites set suspended_for_invoice_id = v_other
      where project_id = new.project_id and status = 'suspended' and suspended_for_invoice_id = new.id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists invoices_release_suspension on public.invoices;
create trigger invoices_release_suspension after update on public.invoices
  for each row execute function public.invoices_release_suspension();

-- ---------- What the admin sees ----------
create or replace view public.payment_suspension_queue
with (security_invoker = true) as
select
  i.id                as invoice_id,
  i.invoice_number,
  i.project_id,
  coalesce(p.business_name, c.business_name) as business_name,
  c.contact_email,
  i.amount,
  i.amount_paid,
  i.amount_due,
  i.due_at,
  greatest(0, floor(extract(epoch from (now() - i.due_at)) / 86400))::int as days_past_due,
  w.status            as website_status,
  case
    when i.project_id is null    then 'NO PROJECT LINKED'
    when w.status = 'suspended'  then 'SUSPENDED'
    else 'SUSPEND WEBSITE'
  end                 as admin_action
from public.invoices i
join public.clients c on c.id = i.client_id
left join public.projects p on p.id = i.project_id
left join public.websites w on w.project_id = i.project_id
where i.status = 'overdue'
order by i.due_at;

-- ---------- Enforcement lookup (service role only) ----------
-- Returns the website status for a hostname, or null if we don't host/manage it.
create or replace function public.site_status_for_host(p_host text)
returns text language sql stable security definer set search_path = public as $$
  select w.status
  from public.websites w
  join public.projects p on p.id = w.project_id
  where exists (
          select 1 from public.domains d
          where d.project_id = p.id
            and regexp_replace(lower(d.domain_name), '^www\.', '') = regexp_replace(lower(p_host), '^www\.', '')
        )
     or regexp_replace(lower(coalesce(p.domain, '')), '^www\.', '') = regexp_replace(lower(p_host), '^www\.', '')
  order by (w.status = 'suspended') desc
  limit 1;
$$;

revoke all on function public.site_status_for_host(text)              from public, anon, authenticated;
revoke all on function public.suspend_website(uuid, text, boolean)    from public, anon, authenticated;
grant execute on function public.site_status_for_host(text)           to service_role;
grant execute on function public.suspend_website(uuid, text, boolean) to service_role;
