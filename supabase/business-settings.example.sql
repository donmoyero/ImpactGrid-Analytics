-- TEMPLATE — do not run as-is. Replace every value with your real details, then run it once in the
-- Supabase SQL editor. Re-running updates the values. These rows are admin-only (RLS) and are read
-- server-side when an invoice PDF is generated; they are never sent to the browser.

insert into public.business_settings (key, value) values
  ('bank_details', jsonb_build_object(
    'account_name',   'REPLACE: name on the bank account',
    'sort_code',      'REPLACE: 12-34-56',
    'account_number', 'REPLACE: 8 digits',
    'bank_name',      'REPLACE: optional, e.g. Monzo'
  )),
  ('business_profile', jsonb_build_object(
    'name',          'ImpactGrid Analytics',
    'email',         'hello@impactgridanalytics.com',
    'website',       'impactgridanalytics.com',
    'address_lines', jsonb_build_array('REPLACE: address line 1', 'Manchester', 'United Kingdom')
  ))
on conflict (key) do update set value = excluded.value, updated_at = now();
