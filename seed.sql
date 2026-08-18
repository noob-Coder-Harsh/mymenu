-- Demo store for I0 / later customer testing
-- Run after schema.sql in the Supabase SQL editor, or use `npm run seed`.

insert into public.users (id, firebase_uid, name, phone, email, is_active)
values (
  '11111111-1111-1111-1111-111111111111',
  'demo-firebase-uid-brew-cafe',
  'Demo Owner',
  '+919999999999',
  'demo@foodbaba.local',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  is_active = true;

insert into public.stores (
  id,
  owner_user_id,
  name,
  slug,
  description,
  phone,
  upi_id,
  is_open,
  is_active
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Brew Cafe',
  'brew-cafe',
  'Demo coffee cart for FoodBaba MVP.',
  '+919999999999',
  'brewcafe@upi',
  true,
  true
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  phone = excluded.phone,
  upi_id = excluded.upi_id,
  is_open = true,
  is_active = true;

update public.store_settings
set
  currency = 'INR',
  order_prefix = 'FD',
  customer_phone_required = true,
  order_notifications_enabled = true,
  auto_accept_orders = false
where store_id = '22222222-2222-2222-2222-222222222222';

insert into public.menu_categories (id, store_id, name, sort_order, is_active)
values
  (
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222222',
    'Coffee',
    0,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222',
    'Snacks',
    1,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.menu_items (
  id,
  store_id,
  category_id,
  name,
  description,
  price,
  sort_order,
  is_available,
  is_active
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Cappuccino',
    'Creamy espresso with steamed milk.',
    120,
    0,
    true,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Latte',
    'Smooth espresso with extra milk.',
    140,
    1,
    true,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'Americano',
    'Espresso with hot water.',
    100,
    2,
    true,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333332',
    'Veg Sandwich',
    'Toasted sandwich with fresh veggies.',
    180,
    0,
    true,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333332',
    'Fries',
    'Crispy salted fries.',
    120,
    1,
    false,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  sort_order = excluded.sort_order,
  is_available = excluded.is_available,
  is_active = true;
