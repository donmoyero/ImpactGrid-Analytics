-- Care Plan expiry chain. Run once after migrations-suspension.sql (safe to re-run).
--
--   care_plans.status: trialing | active | past_due | cancelled | expired | suspended   (already in place)
--
--   PAST DUE -> grace period (7 days) -> reminder -> final reminder -> website MAINTENANCE MODE
--   Stripe keeps retrying the card the whole time; if it succeeds the plan goes back to active,
--   the website comes back automatically and the chain resets.
--
-- Timing (all relative to the moment the plan went past_due; grace length is set once, below):
--   day 0 past due . day 7 grace ends + reminder . day 14 final reminder . day 21 maintenance mode

-- ---------- Columns ----------
alter table public.care_plans
  add column if not exists past_due_since timestamptz;

alter table public.websites
  add column if not exists maintenance_for_care_plan_id uuid references public.care_plans(id) on delete set null;

-- ---------- care_plans: start / clear the grace period automatically ----------
-- (replaces the version in migrations-operations.sql; the original behaviour is kept)
create or replace function public.care_plans_before_write()
returns trigger language plpgsql as $$
declare
  entering boolean;
begin
  new.updated_at := now();
  if new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at := now();
  end if;

  if new.status = 'past_due' then
    if tg_op = 'INSERT' then
      entering := true;
    else
      entering := old.status is distinct from 'past_due';
    end if;
    if entering or new.past_due_since is null then
      new.past_due_since := now();
      new.grace_period_ends_at := new.past_due_since + interval '7 days';   -- grace period length
    end if;
  else
    new.past_due_since := null;
    new.grace_period_ends_at := null;
  end if;
  return new;
end;
$$;

-- ---------- websites: remember WHY a site is in maintenance ----------
-- (replaces the version from migrations-suspension.sql; adds the maintenance link)
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
  if new.status <> 'maintenance' then
    new.maintenance_for_care_plan_id := null;
  end if;
  return new;
end;
$$;

-- ---------- Maintenance mode (service role only) ----------
-- Only ever moves a LIVE site (or creates the row). A suspended or still-building site is left alone.
-- Returns true if the site is now in maintenance because of this call, false if nothing changed.
drop function if exists public.put_website_in_maintenance(uuid, text, uuid);
create function public.put_website_in_maintenance(
  p_project_id uuid,
  p_reason text default null,
  p_care_plan_id uuid default null
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.websites (project_id, status, maintenance_reason, maintenance_for_care_plan_id)
  values (
    p_project_id, 'maintenance',
    coalesce(nullif(trim(p_reason), ''), case when p_care_plan_id is not null then 'Care Plan payment overdue' else 'Maintenance' end),
    p_care_plan_id
  )
  on conflict (project_id) do update
    set status = 'maintenance',
        maintenance_reason = excluded.maintenance_reason,
        maintenance_for_care_plan_id = excluded.maintenance_for_care_plan_id
    where public.websites.status in ('live', 'maintenance')
  returning id into v_id;
  return v_id is not null;
end;
$$;

-- ---------- Recovery: card finally works -> website back, reminder chain reset ----------
create or replace function public.care_plans_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('active', 'trialing') and old.status is distinct from new.status then
    update public.websites set status = 'live'
    where project_id = new.project_id and status = 'maintenance' and maintenance_for_care_plan_id = new.id;
    -- so next year's failure gets a fresh reminder chain (one row per plan+type is allowed)
    delete from public.payment_reminders where care_plan_id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists care_plans_after_update on public.care_plans;
create trigger care_plans_after_update after update on public.care_plans
  for each row execute function public.care_plans_after_update();

-- Plans that are already past_due when this runs: start their clock now.
update public.care_plans
   set past_due_since = now(), grace_period_ends_at = now() + interval '7 days'
 where status = 'past_due' and past_due_since is null;

-- ---------- What the admin sees ----------
create or replace view public.care_plan_admin
with (security_invoker = true) as
select
  cp.id            as care_plan_id,
  cp.project_id,
  p.business_name,
  c.contact_email,
  cp.plan,
  cp.status,
  cp.price,
  (cp.started_at at time zone 'Europe/London')::date  as start_date,
  (cp.renewal_at at time zone 'Europe/London')::date  as renewal_date,
  cp.trial_ends_at,
  cp.past_due_since,
  cp.grace_period_ends_at,
  case when cp.status = 'past_due' and cp.past_due_since is not null
       then floor(extract(epoch from (now() - cp.past_due_since)) / 86400)::int end as days_past_due,
  w.status         as website_status,
  (select string_agg(pr.reminder_type, ',' order by pr.created_at)
     from public.payment_reminders pr
    where pr.care_plan_id = cp.id and pr.status = 'sent') as reminders_sent
from public.care_plans cp
join public.projects p on p.id = cp.project_id
left join public.clients c on c.id = p.client_id
left join public.websites w on w.project_id = cp.project_id
order by p.business_name;

revoke all on function public.put_website_in_maintenance(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.put_website_in_maintenance(uuid, text, uuid) to service_role;
