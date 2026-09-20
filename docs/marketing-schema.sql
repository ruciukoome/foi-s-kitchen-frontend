-- Foi's Kitchen — customer marketing contacts, newsletter and abandoned carts
-- Run this once in the Supabase SQL editor (after docs/supabase-schema.sql).

-- --------------------------------------------- profiles: email + opt-in flag
alter table public.profiles add column if not exists email text;
alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default true;

-- Customers may edit their own contact details and their opt-in preference,
-- but never their email (it mirrors auth.users) or is_admin.
grant update (full_name, phone, default_address, default_method, marketing_opt_in)
  on public.profiles to authenticated;

-- Admins can read every customer profile (the contact directory).
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- Copy the email on sign-up (email/password and Google) and keep it fresh.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- is_admin is pinned to false on every sign-up so new customers can never
  -- become admins by accident, even if the column default is ever changed.
  insert into public.profiles (id, full_name, phone, email, is_admin)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email,
    false
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_new_user();

-- Backfill emails for users that signed up before this change.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

-- -------------------------------------------------- newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text not null default 'footer',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant insert on public.newsletter_subscribers to anon;
grant select, insert, update on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins read subscribers" on public.newsletter_subscribers;
create policy "Admins read subscribers"
  on public.newsletter_subscribers for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update subscribers" on public.newsletter_subscribers;
create policy "Admins update subscribers"
  on public.newsletter_subscribers for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ------------------------------------------------------- abandoned carts
create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  method text,
  status text not null default 'active'
    check (status in ('active', 'converted')),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists abandoned_carts_last_active_idx
  on public.abandoned_carts (last_active_at desc);

grant insert, update on public.abandoned_carts to anon;
grant select, insert, update on public.abandoned_carts to authenticated;
grant all on public.abandoned_carts to service_role;

alter table public.abandoned_carts enable row level security;

drop policy if exists "Anyone can save a cart" on public.abandoned_carts;
create policy "Anyone can save a cart"
  on public.abandoned_carts for insert
  to anon, authenticated
  with check (true);

-- A visitor updates their own in-progress cart. Rows older than a day are
-- frozen so an old id can never be edited later.
drop policy if exists "Visitors update a fresh cart" on public.abandoned_carts;
create policy "Visitors update a fresh cart"
  on public.abandoned_carts for update
  to anon, authenticated
  using (created_at > now() - interval '1 day')
  with check (created_at > now() - interval '1 day');

drop policy if exists "Admins read carts" on public.abandoned_carts;
create policy "Admins read carts"
  on public.abandoned_carts for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update carts" on public.abandoned_carts;
create policy "Admins update carts"
  on public.abandoned_carts for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
