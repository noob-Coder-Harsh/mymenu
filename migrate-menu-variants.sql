-- One-time migration for an existing MyMenu DB that still has menu_items.price.
-- Run after deploying the new schema objects, before dropping the old column.
-- Fresh installs should use schema.sql only (do not run this).

-- 1) Create variants table if missing (copy from schema.sql if needed), then:

insert into public.menu_item_variants (menu_item_id, name, price, sort_order, is_available)
select id, '', price, 0, true
from public.menu_items
where not exists (
  select 1 from public.menu_item_variants v where v.menu_item_id = menu_items.id
);

-- 2) Add order_items.menu_item_variant_id if missing (see schema.sql).

-- 3) Drop the old column:
-- alter table public.menu_items drop column if exists price;
