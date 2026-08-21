-- MyMenu MVP schema (Supabase Postgres)
-- Auth: Firebase Auth (phone OTP for merchants)
-- Push: Firebase Cloud Messaging (device_tokens.token = FCM token)
-- DB access: Next.js verifies Firebase ID tokens, then uses Supabase
--           service role for merchant writes. Anon key only for public
--           menu read + order place (customer has no account).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.order_source as enum ('counter', 'qr', 'phone', 'other');
create type public.order_status as enum (
  'pending',
  'accepted',
  'preparing',
  'ready',
  'completed',
  'cancelled'
);
create type public.payment_method as enum ('upi', 'cash', 'card', 'other');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.device_platform as enum ('ios', 'android', 'web');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users (merchants; linked to Firebase Auth via firebase_uid)
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  name text not null,
  phone text not null,
  email text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_firebase_uid_unique unique (firebase_uid),
  constraint users_phone_unique unique (phone)
);

create index users_firebase_uid_idx on public.users (firebase_uid);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  phone text,
  logo_url text,
  upi_id text,
  is_open boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_slug_unique unique (slug)
);

create index stores_owner_user_id_idx on public.stores (owner_user_id);

create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- store_settings (1:1 with store)
-- ---------------------------------------------------------------------------

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  currency text not null default 'INR',
  order_prefix text not null default 'ORD',
  customer_phone_required boolean not null default true,
  order_notifications_enabled boolean not null default true,
  auto_accept_orders boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_settings_store_id_unique unique (store_id)
);

create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

-- Default settings row when a store is created
create or replace function public.handle_new_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_settings (store_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_store_created
after insert on public.stores
for each row execute function public.handle_new_store();

-- ---------------------------------------------------------------------------
-- menu_categories
-- ---------------------------------------------------------------------------

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_categories_store_id_idx on public.menu_categories (store_id);
create index menu_categories_store_sort_idx on public.menu_categories (store_id, sort_order);

create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  name text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_store_id_idx on public.menu_items (store_id);
create index menu_items_category_id_idx on public.menu_items (category_id);
create index menu_items_store_sort_idx on public.menu_items (store_id, sort_order);

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- menu_item_variants (priced options: Small/Large, Half/Full, or single blank name)
-- ---------------------------------------------------------------------------

create table public.menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  name text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  sort_order integer not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_item_variants_menu_item_id_idx
  on public.menu_item_variants (menu_item_id);
create index menu_item_variants_item_sort_idx
  on public.menu_item_variants (menu_item_id, sort_order);

create trigger menu_item_variants_set_updated_at
before update on public.menu_item_variants
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  order_number text not null,
  customer_name text,
  customer_phone text,
  order_source public.order_source not null default 'counter',
  order_status public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'upi',
  payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  is_takeaway boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_store_order_number_unique unique (store_id, order_number)
);

create index orders_store_id_idx on public.orders (store_id);
create index orders_store_status_idx on public.orders (store_id, order_status);
create index orders_store_created_at_idx on public.orders (store_id, created_at desc);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  menu_item_variant_id uuid references public.menu_item_variants (id) on delete set null,
  item_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_menu_item_id_idx on public.order_items (menu_item_id);
create index order_items_menu_item_variant_id_idx on public.order_items (menu_item_variant_id);

-- ---------------------------------------------------------------------------
-- device_tokens (FCM registration tokens for merchants)
-- ---------------------------------------------------------------------------

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  token text not null,
  platform public.device_platform not null,
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_tokens_token_unique unique (token)
);

create index device_tokens_user_id_idx on public.device_tokens (user_id);
create index device_tokens_store_id_idx on public.device_tokens (store_id);

create trigger device_tokens_set_updated_at
before update on public.device_tokens
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Firebase Auth is outside Supabase, so merchant CRUD goes through the
-- Next.js backend with the service role (bypasses RLS).
-- Anon policies below cover customer-facing menu + place-order only.
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.stores enable row level security;
alter table public.store_settings enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.device_tokens enable row level security;

-- Public catalog (QR / customer menu)
create policy "stores_select_public_active"
  on public.stores for select
  to anon, authenticated
  using (is_active = true);

create policy "menu_categories_select_public"
  on public.menu_categories for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.stores s
      where s.id = store_id and s.is_active = true
    )
  );

create policy "menu_items_select_public"
  on public.menu_items for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.stores s
      where s.id = store_id and s.is_active = true
    )
  );

create policy "menu_item_variants_select_public"
  on public.menu_item_variants for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.menu_items i
      join public.stores s on s.id = i.store_id
      where i.id = menu_item_id
        and i.is_active = true
        and s.is_active = true
    )
  );

-- Customers place orders (no login)
create policy "orders_insert_public"
  on public.orders for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.is_active = true and s.is_open = true
    )
  );

create policy "order_items_insert_public"
  on public.order_items for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.orders o
      join public.stores s on s.id = o.store_id
      where o.id = order_id
        and s.is_active = true
        and s.is_open = true
    )
  );

-- Anon needs table grants; RLS still applies.
grant select on table public.stores to anon, authenticated;
grant select on table public.menu_categories to anon, authenticated;
grant select on table public.menu_items to anon, authenticated;
grant select on table public.menu_item_variants to anon, authenticated;
grant insert on table public.orders to anon, authenticated;
grant insert on table public.order_items to anon, authenticated;
grant all on table public.orders to service_role;
grant all on table public.order_items to service_role;
grant all on table public.menu_item_variants to service_role;

-- ---------------------------------------------------------------------------
-- Storage (logos + menu item images). Uploads go through the service role.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

drop policy if exists "store_assets_public_read" on storage.objects;
create policy "store_assets_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'store-assets');
