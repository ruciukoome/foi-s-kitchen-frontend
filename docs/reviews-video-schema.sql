-- Foi's Kitchen — customer-submitted reviews (with approval) + gallery video support
-- Run once in the Supabase SQL editor. Safe to re-run.

-- ----------------------------------------------- testimonials: moderation
alter table public.testimonials
  add column if not exists status text not null default 'approved',
  add column if not exists submitted_by uuid references auth.users (id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  alter table public.testimonials
    add constraint testimonials_status_check check (status in ('pending', 'approved', 'hidden'));
exception when duplicate_object then null;
end $$;

create index if not exists testimonials_status_idx on public.testimonials (status);

-- Public sees approved reviews only; admins see everything.
drop policy if exists "Public read testimonials" on public.testimonials;
create policy "Public read testimonials" on public.testimonials
  for select to anon, authenticated
  using (status = 'approved' or public.is_admin(auth.uid()));

-- Signed-in customers may submit their own review, always as pending.
drop policy if exists "Customers submit reviews" on public.testimonials;
create policy "Customers submit reviews" on public.testimonials
  for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending');

-- Admin write policy from cms-schema.sql stays in place ("Admins write testimonials").

-- ------------------------------------------- media_assets: video + embeds
alter table public.media_assets
  add column if not exists media_type text not null default 'image',
  add column if not exists poster_url text;

do $$
begin
  alter table public.media_assets
    add constraint media_assets_media_type_check check (media_type in ('image', 'video', 'embed'));
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- FIX (run this): the public read policy calls public.is_admin(), so anonymous
-- visitors need EXECUTE on it. Without this grant every signed-out visitor gets
-- "permission denied for function is_admin" and sees no reviews at all.
-- ---------------------------------------------------------------------------
grant execute on function public.is_admin(uuid) to anon, authenticated;
