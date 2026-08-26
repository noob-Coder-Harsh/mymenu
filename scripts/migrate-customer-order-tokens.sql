-- Customer FCM tokens linked to a specific order (run on existing DBs).

create table if not exists public.customer_order_tokens (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  device_id text not null,
  token text not null,
  platform public.device_platform not null,
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_order_tokens_order_device_unique unique (order_id, device_id)
);

create index if not exists customer_order_tokens_order_id_idx
  on public.customer_order_tokens (order_id);
create index if not exists customer_order_tokens_store_id_idx
  on public.customer_order_tokens (store_id);
create index if not exists customer_order_tokens_token_idx
  on public.customer_order_tokens (token);

drop trigger if exists customer_order_tokens_set_updated_at on public.customer_order_tokens;
create trigger customer_order_tokens_set_updated_at
before update on public.customer_order_tokens
for each row execute function public.set_updated_at();

alter table public.customer_order_tokens enable row level security;

grant all on table public.customer_order_tokens to service_role;
