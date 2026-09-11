-- Foi's Kitchen — customer accounts, profiles, orders + order tracking
-- Run this once in the Supabase SQL editor of the connected project.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  default_address text,
  default_method text not null default 'Delivery'
    check (default_method in ('Delivery', 'Pickup')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------ admin check helper
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _user_id and p.is_admin = true
  );
$$;

revoke execute on function public.is_admin(uuid) from public;
revoke execute on function public.is_admin(uuid) from anon;
-- REQUIRED: Postgres checks EXECUTE on every function referenced by the
-- combined RLS policy set for a role, not just the branch that matches.
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to service_role;

-- ------------------------------------------------------------------ orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  guest_name text,
  guest_phone text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  method text not null default 'Delivery'
    check (method in ('Delivery', 'Pickup')),
  address text,
  preferred_time text,
  notes text,
  status text not null default 'Received'
    check (status in ('Received', 'Preparing', 'Out for delivery',
                      'Ready for pickup', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

grant insert on public.orders to anon;
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists "Guests can insert orders" on public.orders;
create policy "Guests can insert orders"
  on public.orders for insert
  to anon
  with check (user_id is null);

drop policy if exists "Users can insert own or guest orders" on public.orders;
create policy "Users can insert own or guest orders"
  on public.orders for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins read all orders" on public.orders;
create policy "Admins read all orders"
  on public.orders for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- --------------------------------------------- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id)
select u.id from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
