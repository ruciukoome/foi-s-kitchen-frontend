-- Foi's Kitchen — CMS schema (media library, catalog content, page sections)
-- Run once in the Supabase SQL editor of the connected project.
-- Safe to re-run.

-- ------------------------------------------------------------ media_assets
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  alt_text text,
  label text,
  uploaded_at timestamptz not null default now()
);

create index if not exists media_assets_label_idx on public.media_assets (label);

grant select on public.media_assets to anon;
grant select, insert, update, delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;

alter table public.media_assets enable row level security;

drop policy if exists "Public read media" on public.media_assets;
create policy "Public read media" on public.media_assets
  for select to anon, authenticated using (true);

drop policy if exists "Admins write media" on public.media_assets;
create policy "Admins write media" on public.media_assets
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Postgres checks EXECUTE on every function in the combined policy set.
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to service_role;

-- -------------------------------------------------------------- menu_items
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null default 0,
  category text not null check (category in ('Breakfast', 'Mains', 'Sides', 'Desserts')),
  image_id uuid references public.media_assets (id) on delete set null,
  diet_tags text[] not null default '{}',
  is_available boolean not null default true,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------- services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_id uuid references public.media_assets (id) on delete set null,
  category text not null check (category in ('corporate', 'weddings', 'meal-prep')),
  sort_order int not null default 0
);

-- ------------------------------------------------------------ service_tiers
create table if not exists public.service_tiers (
  id uuid primary key default gen_random_uuid(),
  service_category text not null check (service_category in ('corporate', 'weddings', 'meal-prep')),
  name text not null,
  price numeric not null default 0,
  unit text,
  note text,
  features text[] not null default '{}',
  image_id uuid references public.media_assets (id) on delete set null,
  cta_type text not null default 'quote' check (cta_type in ('quote', 'cart')),
  sort_order int not null default 0
);

-- --------------------------------------------------------------- meal_plans
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  cadence text,
  image_id uuid references public.media_assets (id) on delete set null,
  includes text[] not null default '{}',
  tags text[] not null default '{}',
  sort_order int not null default 0
);

-- ------------------------------------------------------------- testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  rating int not null default 5 check (rating between 1 and 5),
  photo_id uuid references public.media_assets (id) on delete set null,
  sort_order int not null default 0
);

-- ------------------------------------------------------------ gallery_items
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references public.media_assets (id) on delete set null,
  caption text,
  category text not null check (category in ('Weddings', 'Corporate', 'Food', 'Kitchen')),
  sort_order int not null default 0
);

-- ------------------------------------------------------------ page_sections
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  unique (page_slug, section_key)
);

-- ---------------------------------------- shared grants + RLS for content
do $$
declare t text;
begin
  foreach t in array array[
    'menu_items', 'services', 'service_tiers', 'meal_plans',
    'testimonials', 'gallery_items', 'page_sections'
  ] loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Public read %1$s" on public.%1$I', t);
    execute format(
      'create policy "Public read %1$s" on public.%1$I for select to anon, authenticated using (true)', t);

    execute format('drop policy if exists "Admins write %1$s" on public.%1$I', t);
    execute format(
      'create policy "Admins write %1$s" on public.%1$I for all to authenticated '
      'using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))', t);
  end loop;
end $$;

-- --------------------------------------------------- storage: media bucket
-- The bucket itself is created by the app's seed script (Storage API).
-- These policies let the public read and admins manage the files.
drop policy if exists "Public read media bucket" on storage.objects;
create policy "Public read media bucket" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');

drop policy if exists "Admins manage media bucket" on storage.objects;
create policy "Admins manage media bucket" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_admin(auth.uid()))
  with check (bucket_id = 'media' and public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
