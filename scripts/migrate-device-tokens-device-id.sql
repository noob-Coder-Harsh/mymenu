-- Run on existing databases that already have device_tokens without device_id.
-- Safe to re-run (IF NOT EXISTS / null guards).

alter table public.device_tokens
  add column if not exists device_id text;

update public.device_tokens
set device_id = id::text
where device_id is null;

alter table public.device_tokens
  alter column device_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'device_tokens_user_device_unique'
  ) then
    alter table public.device_tokens
      add constraint device_tokens_user_device_unique unique (user_id, device_id);
  end if;
end $$;

create index if not exists orders_store_updated_at_idx
  on public.orders (store_id, updated_at desc);
