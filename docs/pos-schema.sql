-- Foi's Kitchen — Point of Sale. Run once in the SQL editor AFTER docs/inventory-schema.sql. Safe to re-run.
-- Recipes link a menu dish to the stock it uses per portion. Recording a sale
-- through public.pos_record_sale() saves the receipt and deducts every ingredient
-- in the inventory ledger in one step.

create table if not exists public.pos_recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  qty_per_portion numeric not null check (qty_per_portion > 0),
  created_at timestamptz not null default now(),
  unique (menu_item_id, inventory_item_id)
);

create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  sold_at timestamptz not null default now(),
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'M-Pesa', 'Card', 'Bank', 'Other')),
  channel text not null default 'Walk-in' check (channel in ('Walk-in', 'Phone / WhatsApp', 'Website', 'Event', 'Other')),
  customer text,
  note text,
  total numeric not null default 0,
  logged_by uuid references auth.users (id) on delete set null default auth.uid(),
  logged_by_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  unit_price numeric not null,
  quantity numeric not null check (quantity > 0)
);

create index if not exists pos_sales_sold_idx on public.pos_sales (sold_at desc);
create index if not exists pos_sale_items_sale_idx on public.pos_sale_items (sale_id);

grant select, insert, update, delete on public.pos_recipes to authenticated;
grant select on public.pos_sales to authenticated;
grant select on public.pos_sale_items to authenticated;
grant all on public.pos_recipes to service_role;
grant all on public.pos_sales to service_role;
grant all on public.pos_sale_items to service_role;

alter table public.pos_recipes enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;

drop policy if exists "Admins manage recipes" on public.pos_recipes;
create policy "Admins manage recipes" on public.pos_recipes for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "Admins read sales" on public.pos_sales;
create policy "Admins read sales" on public.pos_sales for select to authenticated using (public.is_admin(auth.uid()));
drop policy if exists "Admins read sale items" on public.pos_sale_items;
create policy "Admins read sale items" on public.pos_sale_items for select to authenticated using (public.is_admin(auth.uid()));

-- _items: [{ "menu_item_id": uuid|null, "name": text, "unit_price": num, "quantity": num }]
create or replace function public.pos_record_sale(
  _items jsonb, _sold_at timestamptz default now(), _payment text default 'Cash',
  _channel text default 'Walk-in', _customer text default null, _note text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  sale_id uuid;
  rec_no text;
  who text;
  line jsonb;
  r record;
  total_amt numeric := 0;
  new_qty numeric;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Only admins can record sales'; end if;
  if _items is null or jsonb_array_length(_items) = 0 then raise exception 'Add at least one item'; end if;

  select coalesce(nullif(full_name, ''), email) into who from public.profiles where id = auth.uid();
  rec_no := 'FK-POS-' || to_char(coalesce(_sold_at, now()) at time zone 'Africa/Nairobi', 'YYMMDD') || '-'
            || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.pos_sales (receipt_no, sold_at, payment_method, channel, customer, note, logged_by_name)
  values (rec_no, coalesce(_sold_at, now()), _payment, _channel, nullif(trim(_customer), ''), nullif(trim(_note), ''), who)
  returning id into sale_id;

  for line in select * from jsonb_array_elements(_items) loop
    if (line->>'quantity')::numeric <= 0 then raise exception 'Quantities must be more than zero'; end if;
    insert into public.pos_sale_items (sale_id, menu_item_id, name, unit_price, quantity)
    values (sale_id, nullif(line->>'menu_item_id', '')::uuid, line->>'name',
            (line->>'unit_price')::numeric, (line->>'quantity')::numeric);
    total_amt := total_amt + (line->>'unit_price')::numeric * (line->>'quantity')::numeric;

    if nullif(line->>'menu_item_id', '') is not null then
      for r in
        select pr.inventory_item_id, pr.qty_per_portion * (line->>'quantity')::numeric as used
        from public.pos_recipes pr where pr.menu_item_id = (line->>'menu_item_id')::uuid
      loop
        update public.inventory_items set quantity = quantity - r.used, updated_at = now()
          where id = r.inventory_item_id returning quantity into new_qty;
        insert into public.inventory_transactions
          (item_id, kind, reason, quantity, balance_after, reference, note, logged_by_name)
        values (r.inventory_item_id, 'out', 'POS sale', -r.used, new_qty, rec_no,
                (line->>'quantity') || ' × ' || (line->>'name'), who);
      end loop;
    end if;
  end loop;

  update public.pos_sales set total = total_amt where id = sale_id;
  return rec_no;
end $$;

revoke all on function public.pos_record_sale(jsonb, timestamptz, text, text, text, text) from public, anon;
grant execute on function public.pos_record_sale(jsonb, timestamptz, text, text, text, text) to authenticated;
