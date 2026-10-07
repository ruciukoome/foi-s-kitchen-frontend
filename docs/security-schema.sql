-- Foi's Kitchen — security hardening (audit phases 2 and 3).
-- Run once in the Supabase SQL editor. Safe to re-run.

-- ------------------------------------------------------------ rate limits
-- Used by the website server to slow down automated form/email abuse.
create table if not exists public.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

grant all on public.rate_limits to service_role;
revoke all on public.rate_limits from anon, authenticated;
alter table public.rate_limits enable row level security;
-- No policies: only the server (service role) can touch this table.

create or replace function public.hit_rate_limit(_bucket text, _max integer, _window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _start timestamptz := to_timestamp(floor(extract(epoch from now()) / _window_seconds) * _window_seconds);
  _hits integer;
begin
  insert into public.rate_limits (bucket, window_start, hits)
  values (_bucket, _start, 1)
  on conflict (bucket, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into _hits;

  -- Housekeeping: drop old windows now and then.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return _hits <= _max;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ------------------------------------------------- newsletter: server only
-- Sign-ups now go through the website server (rate limited), so the public
-- can no longer write to the table directly.
drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
revoke insert on public.newsletter_subscribers from anon;

-- ------------------------------------- profiles: confirm admin lock-down
-- Customers may edit only their own contact details and opt-in, never
-- is_admin or email. Re-running this is harmless.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, default_address, default_method, marketing_opt_in)
  on public.profiles to authenticated;

-- CHECK: this should return only the five columns above (no is_admin).
select column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee = 'authenticated' and privilege_type = 'UPDATE'
order by column_name;
