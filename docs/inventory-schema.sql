-- Foi's Kitchen — inventory: stock items + an append-only movement ledger.
-- Run once in the SQL editor. Safe to re-run. Requires public.is_admin(uuid).
-- Stock levels only change through public.inventory_move(), which writes the
-- ledger row and the new balance in one step. Ledger rows can't be edited or deleted.

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Dry store' check (category in
    ('Proteins', 'Fresh produce', 'Starches', 'Dry store', 'Spices', 'Drinks', 'Packaging', 'Other')),
  unit text not null default 'kg' check (unit in ('kg', 'g', 'L', 'ml', 'pcs', 'packs', 'trays', 'bags')),
  quantity numeric not null default 0,
  reorder_level numeric not null default 0,
  avg_cost numeric not null default 0,
  supplier text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  kind text not null check (kind in ('in', 'out', 'adjust')),
  reason text not null,
  quantity numeric not null,          -- signed change (+ in, - out)
  balance_after numeric not null,
  unit_cost numeric,
  supplier text,
  batch text,
  expiry_date date,
  reference text,                     -- optional order / quote / event reference
  note text,
  logged_by uuid references auth.users (id) on delete set null default auth.uid(),
  logged_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists inventory_tx_item_idx on public.inventory_transactions (item_id, created_at desc);
create index if not exists inventory_tx_created_idx on public.inventory_transactions (created_at desc);

grant select, insert, update, delete on public.inventory_items to authenticated;
grant select on public.inventory_transactions to authenticated;
grant all on public.inventory_items to service_role;
grant all on public.inventory_transactions to service_role;

alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;

drop policy if exists "Admins manage inventory items" on public.inventory_items;
create policy "Admins manage inventory items" on public.inventory_items
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins read inventory ledger" on public.inventory_transactions;
create policy "Admins read inventory ledger" on public.inventory_transactions
  for select to authenticated using (public.is_admin(auth.uid()));
-- No insert/update/delete policies: the ledger is written only by inventory_move().

create or replace function public.inventory_move(
  _item_id uuid, _kind text, _reason text, _quantity numeric,
  _unit_cost numeric default null, _supplier text default null, _batch text default null,
  _expiry date default null, _reference text default null, _note text default null
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  cur public.inventory_items%rowtype;
  delta numeric;
  new_qty numeric;
  who text;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Only admins can move stock'; end if;
  if _kind not in ('in', 'out', 'adjust') then raise exception 'Invalid movement type'; end if;
  if _reason is null or length(trim(_reason)) = 0 then raise exception 'A reason is required'; end if;

  select * into cur from public.inventory_items where id = _item_id for update;
  if not found then raise exception 'Item not found'; end if;

  if _kind = 'in' then
    if _quantity <= 0 then raise exception 'Quantity must be more than zero'; end if;
    delta := _quantity;
  elsif _kind = 'out' then
    if _quantity <= 0 then raise exception 'Quantity must be more than zero'; end if;
    if _quantity > cur.quantity then
      raise exception 'Only % % in stock', cur.quantity, cur.unit;
    end if;
    delta := -_quantity;
  else
    -- adjust: _quantity is the physical count
    if _quantity < 0 then raise exception 'Count cannot be negative'; end if;
    if _note is null or length(trim(_note)) = 0 then raise exception 'Add a note explaining the count'; end if;
    delta := _quantity - cur.quantity;
  end if;

  new_qty := cur.quantity + delta;

  select coalesce(nullif(full_name, ''), email) into who from public.profiles where id = auth.uid();

  update public.inventory_items set
    quantity = new_qty,
    avg_cost = case
      when _kind = 'in' and _unit_cost is not null and new_qty > 0
        then ((greatest(cur.quantity, 0) * cur.avg_cost) + (_quantity * _unit_cost)) / new_qty
      else avg_cost end,
    supplier = coalesce(nullif(_supplier, ''), supplier),
    updated_at = now()
  where id = _item_id;

  insert into public.inventory_transactions
    (item_id, kind, reason, quantity, balance_after, unit_cost, supplier, batch, expiry_date, reference, note, logged_by, logged_by_name)
  values
    (_item_id, _kind, _reason, delta, new_qty,
     coalesce(_unit_cost, cur.avg_cost), nullif(_supplier, ''), nullif(_batch, ''), _expiry,
     nullif(_reference, ''), nullif(_note, ''), auth.uid(), who);

  return new_qty;
end $$;

revoke all on function public.inventory_move(uuid, text, text, numeric, numeric, text, text, date, text, text) from public, anon;
grant execute on function public.inventory_move(uuid, text, text, numeric, numeric, text, text, date, text, text) to authenticated;

notify pgrst, 'reload schema';
