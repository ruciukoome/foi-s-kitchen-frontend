-- Foi's Kitchen: website orders -> POS sale + recipe stock deduction.
-- Run AFTER inventory-schema.sql, pos-schema.sql and pos-enhancements-schema.sql. Safe to re-run.
begin;
alter table public.orders add column if not exists pos_receipt_no text;

-- Records a website order once as a POS sale (channel 'Website'), deducting each
-- dish's recipe from stock. Returns what was used and what remains per ingredient.
create or replace function public.pos_sync_order(_order_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype; lines jsonb := '[]'::jsonb; it jsonb; mid uuid; rec text;
  who text; usage jsonb; missing jsonb := '[]'::jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then raise exception 'Only admins can sync orders'; end if;
  select * into o from public.orders where id = _order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.pos_receipt_no is not null then
    return jsonb_build_object('receipt_no', o.pos_receipt_no, 'already', true, 'usage', '[]'::jsonb, 'no_recipe', '[]'::jsonb);
  end if;

  for it in select * from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) loop
    mid := null;
    if coalesce(it->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select id into mid from public.menu_items where id = (it->>'id')::uuid;
    end if;
    if mid is null then
      select id into mid from public.menu_items where lower(trim(name)) = lower(trim(it->>'name')) limit 1;
    end if;
    if mid is null or not exists (select 1 from public.pos_recipes where menu_item_id = mid) then
      missing := missing || to_jsonb(it->>'name');
    end if;
    lines := lines || jsonb_build_array(jsonb_build_object(
      'menu_item_id', mid, 'name', coalesce(nullif(trim(it->>'name'), ''), 'Website item'),
      'unit_price', greatest(coalesce((it->>'price')::numeric, 0), 0),
      'quantity', greatest(coalesce((it->>'qty')::numeric, 1), 1)));
  end loop;

  if o.user_id is not null then
    select coalesce(nullif(full_name, ''), email) into who from public.profiles where id = o.user_id;
  end if;
  who := coalesce(who, o.guest_name, 'Website customer') || coalesce(' · ' || o.guest_phone, '');

  rec := public.pos_record_sale(lines, now(),
    case when o.payment_status = 'paid' and o.payment_method = 'paystack' then 'Other' else 'Cash' end,
    'Website', who, 'Website order ' || coalesce(o.payment_reference, left(o.id::text, 8)));

  update public.orders set pos_receipt_no = rec where id = o.id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'name', i.name, 'unit', i.unit, 'used', u.used, 'remaining', i.quantity,
      'reorder_level', i.reorder_level, 'short', i.quantity < 0) order by i.name), '[]'::jsonb)
    into usage
    from (select item_id, sum(-quantity) as used from public.inventory_transactions
          where reference = rec and kind = 'out' group by item_id) u
    join public.inventory_items i on i.id = u.item_id;

  return jsonb_build_object('receipt_no', rec, 'already', false, 'usage', usage, 'no_recipe', missing);
end $$;

revoke all on function public.pos_sync_order(uuid) from public, anon;
grant execute on function public.pos_sync_order(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
