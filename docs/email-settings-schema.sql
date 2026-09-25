-- Email / integration settings for Foi's Kitchen.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Stores admin-only key/value settings such as the Resend API key, so the
-- key can be pasted once in the admin dashboard instead of being baked
-- into hosting environment variables.

create table if not exists public.admin_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.admin_settings to authenticated;
grant all on public.admin_settings to service_role;

alter table public.admin_settings enable row level security;

-- Admins only. Uses the existing public.is_admin(uuid) security-definer function.
drop policy if exists "Admins can read settings" on public.admin_settings;
create policy "Admins can read settings"
  on public.admin_settings for select to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can write settings" on public.admin_settings;
create policy "Admins can write settings"
  on public.admin_settings for insert to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update settings" on public.admin_settings;
create policy "Admins can update settings"
  on public.admin_settings for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete settings" on public.admin_settings;
create policy "Admins can delete settings"
  on public.admin_settings for delete to authenticated
  using (public.is_admin(auth.uid()));
