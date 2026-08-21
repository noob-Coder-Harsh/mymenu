-- Add dine-in / takeaway flag on orders.
-- Fresh installs: schema.sql already includes is_takeaway.
-- Existing DBs: run this once.

alter table public.orders
  add column if not exists is_takeaway boolean not null default false;

update public.orders
set is_takeaway = false
where is_takeaway is distinct from false;
