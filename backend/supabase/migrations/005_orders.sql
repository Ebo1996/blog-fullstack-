-- ─────────────────────────────────────────────────────────────────────────────
-- 005_orders.sql
-- Orders and order items. Amounts are immutable after creation.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.order_status as enum (
  'pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'
);

create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles(id) on delete restrict,
  event_id                    uuid not null references public.events(id) on delete restrict,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  status                      public.order_status not null default 'pending',
  subtotal                    integer not null default 0,  -- cents
  fees                        integer not null default 0,  -- cents
  total_amount                integer not null default 0,  -- cents
  currency                    char(3) not null default 'USD',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint orders_amounts_non_negative  check (subtotal >= 0 and fees >= 0 and total_amount >= 0),
  constraint orders_total_correct         check (total_amount = subtotal + fees),
  constraint orders_currency_upper        check (currency = upper(currency))
);

comment on table public.orders is 'One order per checkout session. Amounts stored in cents and immutable.';

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.touch_updated_at();

-- ─── Order Items ──────────────────────────────────────────────────────────────

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  ticket_type_id  uuid not null references public.ticket_types(id) on delete restrict,
  quantity        integer not null,
  unit_price      integer not null,  -- price AT time of purchase, immutable
  subtotal        integer not null,
  created_at      timestamptz not null default now(),

  constraint order_items_quantity_positive  check (quantity > 0),
  constraint order_items_price_non_negative check (unit_price >= 0 and subtotal >= 0),
  constraint order_items_subtotal_correct   check (subtotal = unit_price * quantity)
);

comment on table public.order_items is 'Line items per order. unit_price is locked at purchase time.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index idx_orders_user_id            on public.orders(user_id);
create index idx_orders_event_id           on public.orders(event_id);
create index idx_orders_status             on public.orders(status);
create index idx_orders_stripe_session     on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index idx_orders_stripe_intent      on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create index idx_order_items_order_id      on public.order_items(order_id);
create index idx_order_items_ticket_type   on public.order_items(ticket_type_id);
