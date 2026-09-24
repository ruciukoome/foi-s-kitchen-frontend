-- Foi's Kitchen — customer data requests (access / correction / deletion / stop marketing)
-- Admins record requests that arrive by email or WhatsApp, assign them, and close them.
-- Run once in the SQL editor. Safe to re-run. Requires public.is_admin(uuid).

create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('access', 'correction', 'deletion', 'marketing')),
  customer_name text not null,
  customer_contact text not null,
  channel text not null default 'email' check (channel in ('email', 'whatsapp', 'phone', 'other')),
  details text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'rejected')),
  assigned_to uuid references public.profiles (id) on delete set null,
  received_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '30 days'),
  completed_at timestamptz,
  resolution_note text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);

create index if not exists data_requests_status_idx on public.data_requests (status, due_at);

grant select, insert, update, delete on public.data_requests to authenticated;
grant all on public.data_requests to service_role;

alter table public.data_requests enable row level security;

drop policy if exists "Admins manage data requests" on public.data_requests;
create policy "Admins manage data requests" on public.data_requests
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
