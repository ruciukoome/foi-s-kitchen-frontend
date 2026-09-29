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
