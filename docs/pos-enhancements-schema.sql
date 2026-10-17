-- Foi's Kitchen: run AFTER inventory-schema.sql and pos-schema.sql.
-- Re-runnable upgrade. Purchase documents remain private to admins.
begin;
create table if not exists public.pos_off_menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  price numeric not null default 0 check (price >= 0),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pos_off_menu_items to authenticated;
grant all on public.pos_off_menu_items to service_role;
alter table public.pos_off_menu_items enable row level security;
drop policy if exists "Admins manage off-menu dishes" on public.pos_off_menu_items;
create policy "Admins manage off-menu dishes" on public.pos_off_menu_items for all to authenticated
using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

alter table public.pos_recipes alter column menu_item_id drop not null;
alter table public.pos_recipes add column if not exists off_menu_item_id uuid references public.pos_off_menu_items(id) on delete cascade;
alter table public.pos_recipes drop constraint if exists pos_recipe_one_dish;
alter table public.pos_recipes add constraint pos_recipe_one_dish check (num_nonnulls(menu_item_id, off_menu_item_id) = 1);
create unique index if not exists pos_recipe_off_menu_ingredient on public.pos_recipes(off_menu_item_id, inventory_item_id);
alter table public.pos_sale_items add column if not exists off_menu_item_id uuid references public.pos_off_menu_items(id) on delete set null;
alter table public.inventory_transactions add column if not exists reversed_transaction_id uuid references public.inventory_transactions(id);
create unique index if not exists inventory_one_reversal on public.inventory_transactions(reversed_transaction_id);

-- Small documents stored separately, never included in inventory list queries.
create table if not exists public.inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.inventory_transactions(id),
  filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  data_base64 text not null check (length(data_base64) > 0 and length(data_base64) <= 6990508),
  created_at timestamptz not null default now()
);
grant select(id, transaction_id, filename, mime_type, data_base64, created_at) on public.inventory_receipts to authenticated;
grant all on public.inventory_receipts to service_role;
alter table public.inventory_receipts enable row level security;
drop policy if exists "Admins read purchase receipts" on public.inventory_receipts;
create policy "Admins read purchase receipts" on public.inventory_receipts for select to authenticated using (public.is_admin(auth.uid()));

create or replace function public.inventory_check_in_receipt(_movement jsonb, _receipt jsonb) returns numeric
language plpgsql security definer set search_path = public as $$
declare balance numeric; tx uuid; item uuid := (_movement->>'_item_id')::uuid;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then raise exception 'Only admins can check in stock'; end if;
  perform 1 from public.inventory_items where id = item for update;
  balance := public.inventory_move(item, 'in', _movement->>'_reason', (_movement->>'_quantity')::numeric,
    (_movement->>'_unit_cost')::numeric, _movement->>'_supplier', _movement->>'_batch',
    (_movement->>'_expiry')::date, _movement->>'_reference', _movement->>'_note');
  select id into tx from public.inventory_transactions where item_id = item order by created_at desc, id desc limit 1;
  if _receipt is not null then
    if octet_length(decode(_receipt->>'data_base64', 'base64')) > 5242880 then raise exception 'Receipt exceeds 5 MB'; end if;
    insert into public.inventory_receipts(transaction_id, filename, mime_type, data_base64)
      values(tx, _receipt->>'filename', _receipt->>'mime_type', _receipt->>'data_base64');
  end if;
  return balance;
end $$;

-- Undo incorrect check-ins without deleting the original record.
create or replace function public.inventory_reverse_check_in(_transaction_id uuid, _reason text) returns numeric
language plpgsql security definer set search_path = public as $$
declare original public.inventory_transactions%rowtype; item public.inventory_items%rowtype; who text; balance numeric;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then raise exception 'Only admins can remove stock'; end if;
  if _reason is null or length(trim(_reason)) = 0 then raise exception 'A reason is required'; end if;
  select * into original from public.inventory_transactions where id = _transaction_id;
  if not found or original.kind <> 'in' then raise exception 'Only check-ins can be removed'; end if;
  select * into item from public.inventory_items where id = original.item_id for update;
  if exists(select 1 from public.inventory_transactions where reversed_transaction_id = original.id) then raise exception 'This entry has already been removed'; end if;
  if item.quantity < original.quantity then raise exception 'Stock has already been used; record a stock take instead'; end if;
  balance := item.quantity - original.quantity;
  update public.inventory_items set quantity = balance,
    avg_cost = case when balance > 0 then greatest(0, (item.quantity * item.avg_cost - original.quantity * coalesce(original.unit_cost, item.avg_cost)) / balance) else 0 end,
    updated_at = now() where id = item.id;
  select coalesce(nullif(full_name,''),email) into who from public.profiles where id = auth.uid();
  insert into public.inventory_transactions(item_id,kind,reason,quantity,balance_after,unit_cost,note,logged_by_name,reversed_transaction_id)
    values(item.id,'adjust','Accidental check-in removed',-original.quantity,balance,original.unit_cost,trim(_reason),who,original.id);
  return balance;
end $$;

-- Remove an accidentally created item from the active list, preserving all history.
create or replace function public.inventory_remove_item(_item_id uuid, _reason text) returns void
language plpgsql security definer set search_path = public as $$
declare item public.inventory_items%rowtype; who text;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then raise exception 'Only admins can remove stock'; end if;
  if _reason is null or length(trim(_reason)) = 0 then raise exception 'A reason is required'; end if;
  select * into item from public.inventory_items where id = _item_id for update;
  if not found or not item.is_active then raise exception 'Item is not active'; end if;
  if exists(select 1 from public.pos_recipes where inventory_item_id = item.id) then raise exception 'Remove this ingredient from recipes first'; end if;
  select coalesce(nullif(full_name,''),email) into who from public.profiles where id = auth.uid();
  update public.inventory_items set quantity = 0, is_active = false, updated_at = now() where id = item.id;
  insert into public.inventory_transactions(item_id,kind,reason,quantity,balance_after,unit_cost,note,logged_by_name)
    values(item.id,'adjust','Accidental stock item removed',-item.quantity,0,item.avg_cost,trim(_reason),who);
end $$;

revoke all on function public.inventory_check_in_receipt(jsonb,jsonb) from public, anon;
revoke all on function public.inventory_reverse_check_in(uuid,text) from public, anon;
revoke all on function public.inventory_remove_item(uuid,text) from public, anon;
grant execute on function public.inventory_check_in_receipt(jsonb,jsonb) to authenticated;
grant execute on function public.inventory_reverse_check_in(uuid,text) to authenticated;
grant execute on function public.inventory_remove_item(uuid,text) to authenticated;

create or replace function public.pos_record_sale(
  _items jsonb, _sold_at timestamptz default now(), _payment text default 'Cash',
  _channel text default 'Walk-in', _customer text default null, _note text default null
) returns text language plpgsql security definer set search_path = public as $$
declare sale_id uuid; rec_no text; who text; line jsonb; r record; total_amt numeric := 0;
  new_qty numeric; menu_id uuid; off_id uuid; q numeric; price numeric;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then raise exception 'Only admins can record sales'; end if;
  if _items is null or jsonb_typeof(_items) <> 'array' then raise exception 'Add at least one item'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Add at least one item'; end if;
  select coalesce(nullif(full_name,''),email) into who from public.profiles where id = auth.uid();
  rec_no := 'FK-POS-' || to_char(coalesce(_sold_at,now()) at time zone 'Africa/Nairobi','YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  -- Consistent ingredient lock order prevents overlapping sales deadlocking.
  perform 1 from public.inventory_items where id in (
    select pr.inventory_item_id from public.pos_recipes pr join jsonb_array_elements(_items) l on
      pr.menu_item_id = nullif(l->>'menu_item_id','')::uuid or pr.off_menu_item_id = nullif(l->>'off_menu_item_id','')::uuid
  ) order by id for update;
  insert into public.pos_sales(receipt_no,sold_at,payment_method,channel,customer,note,logged_by_name)
    values(rec_no,coalesce(_sold_at,now()),_payment,_channel,nullif(trim(_customer),''),nullif(trim(_note),''),who) returning id into sale_id;
  for line in select * from jsonb_array_elements(_items) loop
    menu_id := nullif(line->>'menu_item_id','')::uuid;
    off_id := nullif(line->>'off_menu_item_id','')::uuid;
    q := (line->>'quantity')::numeric; price := (line->>'unit_price')::numeric;
    if q is null or q <= 0 or q = 'NaN'::numeric then raise exception 'Quantities must be more than zero'; end if;
    if price is null or price < 0 or price = 'NaN'::numeric then raise exception 'Price cannot be negative'; end if;
    if menu_id is not null and off_id is not null then raise exception 'Choose one dish source'; end if;
    if coalesce(length(trim(line->>'name')),0) = 0 then raise exception 'Dish name is required'; end if;
    insert into public.pos_sale_items(sale_id,menu_item_id,off_menu_item_id,name,unit_price,quantity)
      values(sale_id,menu_id,off_id,line->>'name',price,q);
    total_amt := total_amt + price*q;
    for r in select inventory_item_id,qty_per_portion*q as used from public.pos_recipes
      where menu_item_id = menu_id or off_menu_item_id = off_id order by inventory_item_id loop
      update public.inventory_items set quantity = quantity-r.used,updated_at = now() where id = r.inventory_item_id returning quantity into new_qty;
      insert into public.inventory_transactions(item_id,kind,reason,quantity,balance_after,reference,note,logged_by_name)
        values(r.inventory_item_id,'out','POS sale',-r.used,new_qty,rec_no,q || ' × ' || (line->>'name'),who);
    end loop;
  end loop;
  update public.pos_sales set total = total_amt where id = sale_id;
  return rec_no;
end $$;
revoke all on function public.pos_record_sale(jsonb,timestamptz,text,text,text,text) from public, anon;
grant execute on function public.pos_record_sale(jsonb,timestamptz,text,text,text,text) to authenticated;
notify pgrst, 'reload schema';
commit;