-- Paystack payments for Foi's Kitchen.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Adds payment tracking to orders. Paystack keys themselves are stored in
-- the existing public.admin_settings table (see docs/email-settings-schema.sql),
-- under the keys 'paystack_public_key' and 'paystack_secret_key'.

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_method text not null default 'whatsapp',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

-- Constrain the values (drop first so the file can be re-run safely).
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed'));

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('paystack', 'whatsapp', 'email', 'manual'));

create unique index if not exists orders_payment_reference_idx
  on public.orders (payment_reference)
  where payment_reference is not null;

-- ---------------------------------------------------------------------------
-- SECURITY (audit phase 1): orders placed from the browser (WhatsApp / email)
-- can never claim to be paid. Card and M-Pesa orders are created by the
-- server, which uses the service role and is not affected by this trigger.
create or replace function public.orders_guard_browser_insert()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.payment_status := 'unpaid';
    new.payment_reference := null;
    new.paid_at := null;
    if new.payment_method not in ('whatsapp', 'email') then
      new.payment_method := 'whatsapp';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_browser_insert on public.orders;
create trigger orders_guard_browser_insert
  before insert on public.orders
  for each row execute function public.orders_guard_browser_insert();
