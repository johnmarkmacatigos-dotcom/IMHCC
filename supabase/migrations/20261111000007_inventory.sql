-- Inventory: materials, products, and tools the business keeps on hand.
--
-- Every change to a quantity is a row in inventory_movements (stock in, stock out, or a count
-- correction), written only through record_stock_movement(), so the history always adds up.
-- An item can be linked to a hardware catalog product; the product's stock number and
-- "in stock / low / out" label on the website then follow the inventory automatically.
--
-- Who can do what:
--   any active team member (owner, admin, editor, staff): see inventory, add and edit items,
--                                                       record stock in and out
--   owner, admin, editor: correct a count (adjust), archive items
--   owner, admin: delete an item and its history
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type imhcc.inventory_kind as enum ('material', 'product', 'tool', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type imhcc.stock_move_type as enum ('in', 'out', 'adjust');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------
create table if not exists imhcc.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  kind imhcc.inventory_kind not null default 'material',
  category text,
  sku text unique,
  unit text not null default 'pcs',
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  reorder_level numeric(14,2) not null default 0 check (reorder_level >= 0),
  unit_cost numeric(12,2) check (unit_cost >= 0),
  location text,
  supplier text,
  notes text,
  product_id uuid unique references imhcc.products (id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references imhcc.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inventory_items_kind_idx on imhcc.inventory_items (kind) where is_active;

drop trigger if exists inventory_items_touch on imhcc.inventory_items;
create trigger inventory_items_touch before update on imhcc.inventory_items
  for each row execute function imhcc.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Movements (the stock history). Rows are never edited.
-- ---------------------------------------------------------------------------
create table if not exists imhcc.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references imhcc.inventory_items (id) on delete cascade,
  type imhcc.stock_move_type not null,
  -- How much came in or went out; for "adjust", the counted quantity.
  quantity numeric(14,2) not null check (quantity >= 0),
  -- Signed change to the stock and the stock after this movement.
  change numeric(14,2) not null,
  balance_after numeric(14,2) not null check (balance_after >= 0),
  reason text,
  project_id uuid references imhcc.projects (id) on delete set null,
  reference text,
  note text,
  unit_cost numeric(12,2) check (unit_cost >= 0),
  created_by uuid references imhcc.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_item_idx on imhcc.inventory_movements (item_id, created_at desc);
create index if not exists inventory_movements_created_idx on imhcc.inventory_movements (created_at desc);

-- ---------------------------------------------------------------------------
-- Quantities change only through record_stock_movement()
-- ---------------------------------------------------------------------------
create or replace function imhcc.guard_inventory_quantity()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('imhcc.stock_move', true), '') <> 'on' then
    if tg_op = 'INSERT' then
      new.quantity := 0;
    elsif new.quantity is distinct from old.quantity then
      raise exception 'Record a stock movement to change the quantity' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists inventory_items_guard on imhcc.inventory_items;
create trigger inventory_items_guard before insert or update on imhcc.inventory_items
  for each row execute function imhcc.guard_inventory_quantity();

-- Keep a linked catalog product's stock number and label in step with the inventory.
create or replace function imhcc.sync_product_stock()
returns trigger language plpgsql security definer set search_path = imhcc, public as $$
begin
  if new.product_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and new.product_id is not distinct from old.product_id
     and new.quantity = old.quantity
     and new.reorder_level = old.reorder_level then
    return new;
  end if;
  update imhcc.products p
     set stock_quantity = floor(new.quantity)::int,
         stock_status = case
           when p.stock_status = 'made_to_order' then p.stock_status
           when new.quantity <= 0 then 'out_of_stock'::imhcc.stock_status
           when new.quantity <= new.reorder_level then 'low_stock'::imhcc.stock_status
           else 'in_stock'::imhcc.stock_status
         end
   where p.id = new.product_id;
  return new;
end $$;

drop trigger if exists inventory_items_sync_product on imhcc.inventory_items;
create trigger inventory_items_sync_product after insert or update on imhcc.inventory_items
  for each row execute function imhcc.sync_product_stock();

-- ---------------------------------------------------------------------------
-- Recording stock in, stock out, and count corrections
-- ---------------------------------------------------------------------------
create or replace function imhcc.record_stock_movement(
  p_item uuid,
  p_type imhcc.stock_move_type,
  p_quantity numeric,
  p_reason text default null,
  p_project uuid default null,
  p_reference text default null,
  p_note text default null,
  p_unit_cost numeric default null
)
returns imhcc.inventory_movements
language plpgsql security definer set search_path = imhcc, public as $$
declare
  v_item imhcc.inventory_items;
  v_change numeric(14,2);
  v_after numeric(14,2);
  v_row imhcc.inventory_movements;
begin
  if not imhcc.is_team() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_type = 'adjust' and not imhcc.is_editor() then
    raise exception 'Only the owner, admins, and editors can correct a stock count' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 0 or (p_type <> 'adjust' and p_quantity = 0) then
    raise exception 'Enter a quantity above zero' using errcode = '22023';
  end if;
  if p_quantity > 100000000 then
    raise exception 'That quantity is too large' using errcode = '22023';
  end if;

  -- Lock the item so two people recording at the same time cannot miscount.
  select * into v_item from imhcc.inventory_items where id = p_item for update;
  if not found then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;

  v_change := case p_type
    when 'in' then p_quantity
    when 'out' then -p_quantity
    else p_quantity - v_item.quantity
  end;
  v_after := v_item.quantity + v_change;
  if v_after < 0 then
    raise exception 'Only % % in stock', trim(to_char(v_item.quantity, 'FM999999990.##')), v_item.unit
      using errcode = '22023';
  end if;

  perform set_config('imhcc.stock_move', 'on', true);
  update imhcc.inventory_items
     set quantity = v_after,
         unit_cost = case when p_type = 'in' and p_unit_cost is not null then p_unit_cost else unit_cost end
   where id = p_item;
  perform set_config('imhcc.stock_move', 'off', true);

  insert into imhcc.inventory_movements (item_id, type, quantity, change, balance_after, reason, project_id, reference, note, unit_cost)
  values (
    p_item, p_type, p_quantity, v_change, v_after,
    nullif(left(trim(p_reason), 80), ''),
    p_project,
    nullif(left(trim(p_reference), 120), ''),
    nullif(left(trim(p_note), 500), ''),
    p_unit_cost
  )
  returning * into v_row;

  insert into imhcc.activity_logs (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    case p_type when 'in' then 'stocked in' when 'out' then 'stocked out' else 'counted' end,
    'inventory item', p_item::text,
    jsonb_build_object('name', v_item.name, 'quantity', p_quantity, 'unit', v_item.unit, 'balance', v_after)
  );

  return v_row;
end $$;

revoke all on function imhcc.record_stock_movement(uuid, imhcc.stock_move_type, numeric, text, uuid, text, text, numeric) from public, anon;
grant execute on function imhcc.record_stock_movement(uuid, imhcc.stock_move_type, numeric, text, uuid, text, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Stock levels at a glance (respects the tables' Row Level Security)
-- ---------------------------------------------------------------------------
create or replace view imhcc.inventory_levels
with (security_invoker = true) as
select
  i.*,
  case
    when i.quantity <= 0 then 'out'
    when i.quantity <= i.reorder_level then 'low'
    else 'ok'
  end as stock_state,
  round(i.quantity * coalesce(i.unit_cost, 0), 2) as stock_value,
  (select max(m.created_at) from imhcc.inventory_movements m where m.item_id = i.id) as last_moved_at
from imhcc.inventory_items i;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table imhcc.inventory_items enable row level security;
alter table imhcc.inventory_movements enable row level security;

revoke all on imhcc.inventory_items, imhcc.inventory_movements, imhcc.inventory_levels from anon;
grant select, insert, update, delete on imhcc.inventory_items to authenticated;
grant select on imhcc.inventory_movements, imhcc.inventory_levels to authenticated;
revoke insert, update, delete on imhcc.inventory_movements from authenticated;

drop policy if exists "team reads inventory" on imhcc.inventory_items;
drop policy if exists "team adds inventory" on imhcc.inventory_items;
drop policy if exists "team edits inventory" on imhcc.inventory_items;
drop policy if exists "managers delete inventory" on imhcc.inventory_items;
drop policy if exists "team reads stock history" on imhcc.inventory_movements;

create policy "team reads inventory" on imhcc.inventory_items
  for select to authenticated using (imhcc.is_team());
create policy "team adds inventory" on imhcc.inventory_items
  for insert to authenticated with check (imhcc.is_team());
-- Staff can edit details; only editors and up can archive (is_active = false).
create policy "team edits inventory" on imhcc.inventory_items
  for update to authenticated using (imhcc.is_team()) with check (imhcc.is_team() and (is_active or imhcc.is_editor()));
create policy "managers delete inventory" on imhcc.inventory_items
  for delete to authenticated using (imhcc.is_manager());
create policy "team reads stock history" on imhcc.inventory_movements
  for select to authenticated using (imhcc.is_team());

-- PostgREST: pick up the new tables right away.
notify pgrst, 'reload schema';
