-- ─────────────────────────────────────────────────────────────────────────────
-- 004_ticket_types.sql
-- Ticket types per event. Inventory tracked with sold_quantity.
-- Concurrent purchase safety is handled via the purchase_tickets() RPC.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.ticket_type_status as enum ('active', 'inactive', 'sold_out');

create table public.ticket_types (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  name            text not null,
  description     text,
  price           integer not null default 0,   -- stored in cents (USD * 100)
  currency        char(3) not null default 'USD',
  quantity        integer not null,
  sold_quantity   integer not null default 0,
  sales_start_at  timestamptz,
  sales_end_at    timestamptz,
  status          public.ticket_type_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint ticket_types_name_not_empty      check (char_length(name) >= 1),
  constraint ticket_types_price_non_negative  check (price >= 0),
  constraint ticket_types_quantity_positive   check (quantity > 0),
  constraint ticket_types_no_oversell        check (sold_quantity <= quantity),
  constraint ticket_types_sales_window        check (
    sales_start_at is null or sales_end_at is null or sales_end_at > sales_start_at
  ),
  constraint ticket_types_currency_upper      check (currency = upper(currency))
);

comment on table public.ticket_types is 'Ticket tiers per event. Price in smallest currency unit (cents).';
comment on column public.ticket_types.sold_quantity is 'Atomically incremented by purchase_tickets() RPC only.';

create trigger ticket_types_updated_at
  before update on public.ticket_types
  for each row execute procedure public.touch_updated_at();

-- Auto-mark as sold_out when sold_quantity reaches quantity
create or replace function public.auto_update_ticket_type_status()
returns trigger
language plpgsql
as $$
begin
  if new.sold_quantity >= new.quantity then
    new.status = 'sold_out';
  elsif new.status = 'sold_out' and new.sold_quantity < new.quantity then
    new.status = 'active';
  end if;
  return new;
end;
$$;

create trigger ticket_types_auto_status
  before update on public.ticket_types
  for each row execute procedure public.auto_update_ticket_type_status();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index idx_ticket_types_event_id on public.ticket_types(event_id);
create index idx_ticket_types_status   on public.ticket_types(status);
