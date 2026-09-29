-- Homepage content controlled from /admin/homepage. Safe to run more than once.

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

-- The homepage is public, so anyone may READ this table. Never store secrets in it.
drop policy if exists "Anyone can read site_content" on public.site_content;
create policy "Anyone can read site_content" on public.site_content for select using (true);

drop policy if exists "Admins manage site_content" on public.site_content;
create policy "Admins manage site_content" on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());

-- Public bucket for homepage images (uploads are signed by the server after an admin check).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
