-- =============================================================================
-- NORTHSTAR COMBINED MIGRATION
-- Run this entire file in Supabase SQL Editor to set up the full database.
-- =============================================================================

-- ─── HELPER FUNCTIONS (needed by triggers) ───────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- =============================================================================
-- 001: PROFILES
-- =============================================================================

create type public.user_role as enum ('attendee', 'organizer', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  email       text,
  role        public.user_role not null default 'attendee',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'attendee'::public.user_role)
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

create or replace function public.admin_set_user_role(
  target_user_id uuid, new_role public.user_role
)
returns void language plpgsql security definer set search_path = public as $$
declare caller_role public.user_role;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role <> 'admin' then raise exception 'Only admins can change user roles'; end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_user_id;
end; $$;

-- =============================================================================
-- 002: CATEGORIES
-- =============================================================================

create table public.event_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint event_categories_name_not_empty check (char_length(name) >= 1),
  constraint event_categories_slug_format    check (slug ~ '^[a-z0-9-]+$')
);

create trigger event_categories_updated_at
  before update on public.event_categories
  for each row execute procedure public.touch_updated_at();

create index idx_event_categories_slug on public.event_categories(slug);

-- =============================================================================
-- 003: EVENTS
-- =============================================================================

create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid not null references public.profiles(id) on delete restrict,
  category_id     uuid references public.event_categories(id) on delete set null,
  title           text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  location        text,
  venue_name      text,
  venue_address   text,
  city            text,
  country         text,
  start_time      timestamptz,
  end_time        timestamptz,
  start_at        timestamptz,
  end_at          timestamptz,
  capacity        integer,
  status          public.event_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint events_title_not_empty   check (char_length(title) >= 1),
  constraint events_capacity_positive check (capacity is null or capacity > 0),
  constraint events_slug_format       check (slug ~ '^[a-z0-9-]+$')
);

create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.touch_updated_at();

create index idx_events_organizer_id on public.events(organizer_id);
create index idx_events_category_id  on public.events(category_id);
create index idx_events_status       on public.events(status);
create index idx_events_slug         on public.events(slug);
create index idx_events_public       on public.events(status, start_at) where status = 'published';

-- =============================================================================
-- 004: TICKET TYPES
-- =============================================================================

create type public.ticket_type_status as enum ('active', 'inactive', 'sold_out');

create table public.ticket_types (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  name            text not null,
  description     text,
  price           integer not null default 0,
  currency        char(3) not null default 'USD',
  capacity        integer not null,
  sold            integer not null default 0,
  quantity        integer,
  sold_quantity   integer not null default 0,
  sales_start_at  timestamptz,
  sales_end_at    timestamptz,
  status          public.ticket_type_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint ticket_types_name_not_empty     check (char_length(name) >= 1),
  constraint ticket_types_price_non_negative check (price >= 0),
  constraint ticket_types_capacity_positive  check (capacity > 0)
);

create trigger ticket_types_updated_at
  before update on public.ticket_types
  for each row execute procedure public.touch_updated_at();

create or replace function public.auto_update_ticket_type_status()
returns trigger language plpgsql as $$
begin
  if new.sold_quantity >= coalesce(new.quantity, new.capacity) then new.status = 'sold_out';
  elsif new.status = 'sold_out' and new.sold_quantity < coalesce(new.quantity, new.capacity) then new.status = 'active';
  end if;
  return new;
end; $$;

create trigger ticket_types_auto_status
  before update on public.ticket_types
  for each row execute procedure public.auto_update_ticket_type_status();

create index idx_ticket_types_event_id on public.ticket_types(event_id);
create index idx_ticket_types_status   on public.ticket_types(status);

-- =============================================================================
-- 005: ORDERS
-- =============================================================================

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
  subtotal                    integer not null default 0,
  fees                        integer not null default 0,
  total_amount                integer not null default 0,
  currency                    char(3) not null default 'USD',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint orders_amounts_non_negative check (subtotal >= 0 and fees >= 0 and total_amount >= 0)
);

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.touch_updated_at();

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  ticket_type_id  uuid not null references public.ticket_types(id) on delete restrict,
  quantity        integer not null,
  unit_price      integer not null,
  subtotal        integer not null,
  created_at      timestamptz not null default now(),
  constraint order_items_quantity_positive  check (quantity > 0),
  constraint order_items_price_non_negative check (unit_price >= 0 and subtotal >= 0)
);

create index idx_orders_user_id   on public.orders(user_id);
create index idx_orders_event_id  on public.orders(event_id);
create index idx_orders_status    on public.orders(status);
create index idx_order_items_order_id on public.order_items(order_id);

-- =============================================================================
-- 006: TICKETS + RPCs
-- =============================================================================

create type public.ticket_status as enum ('active', 'used', 'cancelled', 'transferred', 'expired');

create table public.tickets (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete restrict,
  event_id        uuid not null references public.events(id) on delete restrict,
  ticket_type_id  uuid not null references public.ticket_types(id) on delete restrict,
  user_id         uuid not null references public.profiles(id) on delete restrict,
  ticket_code     text not null unique,
  qr_token        text not null unique,
  status          public.ticket_status not null default 'active',
  checked_in_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint tickets_qr_token_length check (char_length(qr_token) >= 32)
);

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.touch_updated_at();

create index idx_tickets_user_id      on public.tickets(user_id);
create index idx_tickets_event_id     on public.tickets(event_id);
create index idx_tickets_order_id     on public.tickets(order_id);
create index idx_tickets_qr_token     on public.tickets(qr_token);
create index idx_tickets_status       on public.tickets(status);
create index idx_tickets_event_status on public.tickets(event_id, status);

-- purchase_tickets RPC
create or replace function public.purchase_tickets(
  p_order_id uuid,
  p_items    jsonb
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  item       record;
  tt         record;
  i          integer;
  tcode      text;
  qtoken     text;
begin
  if not exists (select 1 from public.orders where id = p_order_id and user_id = auth.uid()) then
    return jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  end if;
  for item in select * from jsonb_to_recordset(p_items) as x(ticket_type_id uuid, quantity integer, unit_price integer) loop
    select * into tt from public.ticket_types where id = item.ticket_type_id for update;
    if not found then return jsonb_build_object('success', false, 'error', 'Ticket type not found'); end if;
    if tt.status = 'inactive' then return jsonb_build_object('success', false, 'error', 'Ticket type not available'); end if;
    if (tt.sold_quantity + item.quantity) > coalesce(tt.quantity, tt.capacity) then
      return jsonb_build_object('success', false, 'error', 'Not enough tickets available for: ' || tt.name);
    end if;
    insert into public.order_items (order_id, ticket_type_id, quantity, unit_price, subtotal)
    values (p_order_id, item.ticket_type_id, item.quantity, item.unit_price, item.unit_price * item.quantity);
    update public.ticket_types set sold_quantity = sold_quantity + item.quantity, sold = sold + item.quantity where id = item.ticket_type_id;
    for i in 1..item.quantity loop
      tcode  := 'NS-' || upper(substring(encode(gen_random_bytes(8), 'hex') for 8));
      qtoken := encode(gen_random_bytes(24), 'hex');
      while exists (select 1 from public.tickets where ticket_code = tcode) loop tcode := 'NS-' || upper(substring(encode(gen_random_bytes(8), 'hex') for 8)); end loop;
      while exists (select 1 from public.tickets where tickets.qr_token = qtoken) loop qtoken := encode(gen_random_bytes(24), 'hex'); end loop;
      insert into public.tickets (order_id, event_id, ticket_type_id, user_id, ticket_code, qr_token)
      select p_order_id, tt.event_id, item.ticket_type_id, o.user_id, tcode, qtoken from public.orders o where o.id = p_order_id;
    end loop;
  end loop;
  return jsonb_build_object('success', true);
end; $$;

-- =============================================================================
-- 007: REGISTRATIONS
-- =============================================================================

create table public.registrations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  ticket_type_id    uuid references public.ticket_types(id) on delete set null,
  quantity          integer not null default 1,
  status            varchar(20) not null default 'active' check (status in ('active', 'cancelled', 'waitlist')),
  waitlist_position integer check (waitlist_position > 0),
  notified_at       timestamptz,
  attended          boolean not null default false,
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger registrations_updated_at
  before update on public.registrations
  for each row execute procedure public.touch_updated_at();

create index idx_registrations_user_id  on public.registrations(user_id);
create index idx_registrations_event_id on public.registrations(event_id);
create index idx_registrations_status   on public.registrations(event_id, status);
create index idx_registrations_waitlist on public.registrations(event_id, status, waitlist_position) where status = 'waitlist';

-- =============================================================================
-- 008: TICKET TRANSFERS
-- =============================================================================

create type public.transfer_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'expired');

create table public.ticket_transfers (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null references public.tickets(id) on delete cascade,
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  to_user_id    uuid not null references public.profiles(id) on delete cascade,
  status        public.transfer_status not null default 'pending',
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  constraint transfers_different_users check (from_user_id <> to_user_id)
);

create index idx_transfers_ticket_id   on public.ticket_transfers(ticket_id);
create index idx_transfers_from_user   on public.ticket_transfers(from_user_id);
create index idx_transfers_to_user     on public.ticket_transfers(to_user_id);
create index idx_transfers_status      on public.ticket_transfers(status);
create unique index idx_transfers_one_pending on public.ticket_transfers(ticket_id) where status = 'pending';

create or replace function public.accept_ticket_transfer(p_transfer_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tr record; ticket_rec record; new_code text; new_token text;
begin
  select * into tr from public.ticket_transfers where id = p_transfer_id for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Transfer not found'); end if;
  if tr.to_user_id <> auth.uid() then return jsonb_build_object('success', false, 'error', 'Unauthorized'); end if;
  if tr.status <> 'pending' then return jsonb_build_object('success', false, 'error', 'Transfer is no longer pending'); end if;
  if tr.expires_at < now() then
    update public.ticket_transfers set status = 'expired' where id = tr.id;
    return jsonb_build_object('success', false, 'error', 'Transfer has expired');
  end if;
  select * into ticket_rec from public.tickets where id = tr.ticket_id for update;
  if ticket_rec.status <> 'active' then return jsonb_build_object('success', false, 'error', 'Ticket is no longer transferable'); end if;
  new_code  := 'NS-' || upper(substring(encode(gen_random_bytes(8), 'hex') for 8));
  new_token := encode(gen_random_bytes(24), 'hex');
  update public.tickets set status = 'transferred', updated_at = now() where id = ticket_rec.id;
  insert into public.tickets (order_id, event_id, ticket_type_id, user_id, ticket_code, qr_token)
  values (ticket_rec.order_id, ticket_rec.event_id, ticket_rec.ticket_type_id, tr.to_user_id, new_code, new_token);
  update public.ticket_transfers set status = 'accepted', accepted_at = now() where id = tr.id;
  return jsonb_build_object('success', true);
end; $$;

-- =============================================================================
-- 009: CHECK-INS
-- =============================================================================

create table public.check_ins (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.tickets(id) on delete cascade,
  event_id        uuid not null references public.events(id) on delete cascade,
  checked_in_by   uuid not null references public.profiles(id) on delete restrict,
  checked_in_at   timestamptz not null default now()
);

create unique index idx_check_ins_ticket_unique on public.check_ins(ticket_id);
create index idx_check_ins_event_id             on public.check_ins(event_id);
create index idx_check_ins_checked_in_at        on public.check_ins(event_id, checked_in_at desc);

create or replace function public.validate_and_checkin(
  p_qr_token text, p_event_id uuid, p_checked_in_by uuid
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ticket_rec record;
begin
  select t.*, tt.name as type_name, p.full_name as attendee_name
  into ticket_rec
  from public.tickets t
  join public.ticket_types tt on tt.id = t.ticket_type_id
  join public.profiles p      on p.id  = t.user_id
  where t.qr_token = p_qr_token for update;
  if not found then return jsonb_build_object('success', false, 'status', 'invalid'); end if;
  if ticket_rec.event_id <> p_event_id then return jsonb_build_object('success', false, 'status', 'wrong_event'); end if;
  if not exists (select 1 from public.events e join public.profiles p on p.id = p_checked_in_by where e.id = p_event_id and (e.organizer_id = p_checked_in_by or p.role = 'admin')) then
    return jsonb_build_object('success', false, 'status', 'unauthorized');
  end if;
  if ticket_rec.status = 'used' then
    return jsonb_build_object('success', false, 'status', 'already_checked_in', 'ticket_id', ticket_rec.id, 'attendee_name', ticket_rec.attendee_name, 'ticket_type', ticket_rec.type_name);
  end if;
  if ticket_rec.status <> 'active' then return jsonb_build_object('success', false, 'status', ticket_rec.status); end if;
  update public.tickets set status = 'used', checked_in_at = now() where id = ticket_rec.id;
  insert into public.check_ins (ticket_id, event_id, checked_in_by) values (ticket_rec.id, p_event_id, p_checked_in_by);
  return jsonb_build_object('success', true, 'status', 'valid', 'ticket_id', ticket_rec.id, 'attendee_name', ticket_rec.attendee_name, 'ticket_type', ticket_rec.type_name);
end; $$;

-- =============================================================================
-- 010: NOTIFICATIONS
-- =============================================================================

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  message     text not null,
  data        jsonb,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id, created_at desc);
create index idx_notifications_unread  on public.notifications(user_id, read_at) where read_at is null;

create or replace function public.create_notification(
  p_user_id uuid, p_type text, p_title text, p_message text, p_data jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, message, data)
  values (p_user_id, p_type, p_title, p_message, p_data);
end; $$;

-- =============================================================================
-- 011: ROW LEVEL SECURITY
-- =============================================================================

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles         enable row level security;
alter table public.event_categories enable row level security;
alter table public.events           enable row level security;
alter table public.ticket_types     enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.tickets          enable row level security;
alter table public.registrations    enable row level security;
alter table public.ticket_transfers enable row level security;
alter table public.check_ins        enable row level security;
alter table public.notifications    enable row level security;

-- Profiles
create policy "profiles: owner read"   on public.profiles for select using (id = auth.uid());
create policy "profiles: admin read"   on public.profiles for select using (public.current_user_role() = 'admin');
create policy "profiles: owner update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Categories
create policy "categories: public read"   on public.event_categories for select using (true);
create policy "categories: admin insert"  on public.event_categories for insert with check (public.current_user_role() = 'admin');
create policy "categories: admin update"  on public.event_categories for update using (public.current_user_role() = 'admin');
create policy "categories: admin delete"  on public.event_categories for delete using (public.current_user_role() = 'admin');

-- Events
create policy "events: public read"       on public.events for select using (status = 'published');
create policy "events: organizer read"    on public.events for select using (organizer_id = auth.uid());
create policy "events: admin read"        on public.events for select using (public.current_user_role() = 'admin');
create policy "events: organizer insert"  on public.events for insert with check (organizer_id = auth.uid() and public.current_user_role() in ('organizer','admin'));
create policy "events: organizer update"  on public.events for update using (organizer_id = auth.uid() and public.current_user_role() in ('organizer','admin'));
create policy "events: admin update"      on public.events for update using (public.current_user_role() = 'admin');
create policy "events: organizer delete"  on public.events for delete using (organizer_id = auth.uid() and status = 'draft');
create policy "events: admin delete"      on public.events for delete using (public.current_user_role() = 'admin');

-- Ticket Types
create policy "ticket_types: public read"     on public.ticket_types for select using (status <> 'inactive' and exists (select 1 from public.events e where e.id = event_id and e.status = 'published'));
create policy "ticket_types: organizer read"  on public.ticket_types for select using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "ticket_types: admin read"      on public.ticket_types for select using (public.current_user_role() = 'admin');
create policy "ticket_types: organizer insert" on public.ticket_types for insert with check (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()) and public.current_user_role() in ('organizer','admin'));
create policy "ticket_types: organizer update" on public.ticket_types for update using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "ticket_types: admin update"    on public.ticket_types for update using (public.current_user_role() = 'admin');
create policy "ticket_types: organizer delete" on public.ticket_types for delete using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()) and public.current_user_role() in ('organizer','admin'));

-- Orders
create policy "orders: attendee read"    on public.orders for select using (user_id = auth.uid());
create policy "orders: organizer read"   on public.orders for select using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "orders: admin read"       on public.orders for select using (public.current_user_role() = 'admin');
create policy "orders: authenticated insert" on public.orders for insert with check (user_id = auth.uid());
create policy "orders: admin update"     on public.orders for update using (public.current_user_role() = 'admin');

-- Order Items
create policy "order_items: attendee read"  on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items: organizer read" on public.order_items for select using (exists (select 1 from public.orders o join public.events e on e.id = o.event_id where o.id = order_id and e.organizer_id = auth.uid()));
create policy "order_items: admin read"     on public.order_items for select using (public.current_user_role() = 'admin');

-- Tickets
create policy "tickets: attendee read"   on public.tickets for select using (user_id = auth.uid());
create policy "tickets: organizer read"  on public.tickets for select using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "tickets: admin read"      on public.tickets for select using (public.current_user_role() = 'admin');

-- Registrations
create policy "registrations: attendee read"   on public.registrations for select using (user_id = auth.uid());
create policy "registrations: organizer read"  on public.registrations for select using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "registrations: admin read"      on public.registrations for select using (public.current_user_role() = 'admin');
create policy "registrations: insert"          on public.registrations for insert with check (user_id = auth.uid());
create policy "registrations: owner update"    on public.registrations for update using (user_id = auth.uid());
create policy "registrations: owner delete"    on public.registrations for delete using (user_id = auth.uid());

-- Ticket Transfers
create policy "transfers: parties read"    on public.ticket_transfers for select using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy "transfers: organizer read"  on public.ticket_transfers for select using (exists (select 1 from public.tickets t join public.events e on e.id = t.event_id where t.id = ticket_id and e.organizer_id = auth.uid()));
create policy "transfers: admin read"      on public.ticket_transfers for select using (public.current_user_role() = 'admin');
create policy "transfers: owner insert"    on public.ticket_transfers for insert with check (from_user_id = auth.uid() and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid() and t.status = 'active'));
create policy "transfers: parties update"  on public.ticket_transfers for update using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- Check-ins
create policy "check_ins: attendee read"   on public.check_ins for select using (exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "check_ins: organizer read"  on public.check_ins for select using (exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));
create policy "check_ins: admin read"      on public.check_ins for select using (public.current_user_role() = 'admin');

-- Notifications
create policy "notifications: owner read"   on public.notifications for select using (user_id = auth.uid());
create policy "notifications: owner update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: owner delete" on public.notifications for delete using (user_id = auth.uid());
create policy "notifications: admin read"   on public.notifications for select using (public.current_user_role() = 'admin');

-- =============================================================================
-- 012: STORAGE BUCKETS
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-images', 'event-images', true, 5242880, array['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('avatars',      'avatars',      true, 2097152, array['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "event-images: public read"   on storage.objects for select using (bucket_id = 'event-images');
create policy "event-images: owner upload"  on storage.objects for insert with check (bucket_id = 'event-images' and auth.role() = 'authenticated');
create policy "event-images: owner update"  on storage.objects for update using (bucket_id = 'event-images' and auth.role() = 'authenticated');
create policy "event-images: owner delete"  on storage.objects for delete using (bucket_id = 'event-images' and auth.role() = 'authenticated');
create policy "avatars: public read"        on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars: owner upload"       on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated' and split_part(name, '/', 1) = auth.uid()::text);
create policy "avatars: owner update"       on storage.objects for update using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);
create policy "avatars: owner delete"       on storage.objects for delete using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

-- =============================================================================
-- 013: WEBHOOK EVENTS
-- =============================================================================

create table public.processed_webhook_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text not null unique,
  event_type       text not null,
  processed_at     timestamptz not null default now()
);

alter table public.processed_webhook_events enable row level security;
create index idx_webhook_events_stripe_id on public.processed_webhook_events(stripe_event_id);

-- =============================================================================
-- 014: REFUNDS
-- =============================================================================

create table public.refunds (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  amount           integer not null check (amount > 0),
  currency         varchar(3) not null default 'usd',
  reason           text,
  status           varchar(20) not null default 'pending' check (status in ('pending','succeeded','failed')),
  stripe_refund_id varchar(255),
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.refunds enable row level security;

create index idx_refunds_order_id   on public.refunds(order_id);
create index idx_refunds_created_by on public.refunds(created_by);
create index idx_refunds_status     on public.refunds(status);

create policy "refunds: organizer read" on public.refunds for select using (created_by = auth.uid() or exists (select 1 from public.orders o join public.events e on e.id = o.event_id where o.id = order_id and e.organizer_id = auth.uid()));
create policy "refunds: admin read"     on public.refunds for select using (public.current_user_role() = 'admin');
create policy "refunds: organizer insert" on public.refunds for insert with check (exists (select 1 from public.orders o join public.events e on e.id = o.event_id where o.id = order_id and e.organizer_id = auth.uid()) or public.current_user_role() = 'admin');

create trigger set_refunds_updated_at before update on public.refunds for each row execute function update_updated_at();

-- =============================================================================
-- 015: PROMO CODES
-- =============================================================================

create table public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  code           varchar(50) not null,
  discount_type  varchar(20) not null check (discount_type in ('percentage','fixed')),
  discount_value integer not null check (discount_value > 0),
  currency       varchar(3) not null default 'usd',
  valid_from     timestamptz not null default now(),
  valid_to       timestamptz not null,
  usage_limit    integer check (usage_limit is null or usage_limit > 0),
  used_count     integer not null default 0 check (used_count >= 0),
  min_tickets    integer check (min_tickets is null or min_tickets > 0),
  max_discount   integer check (max_discount is null or max_discount > 0),
  active         boolean not null default true,
  created_by     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint valid_date_range check (valid_to > valid_from)
);

create unique index idx_promo_codes_event_code on public.promo_codes(event_id, upper(code));
create index idx_promo_codes_event_id          on public.promo_codes(event_id);
create index idx_promo_codes_active            on public.promo_codes(active) where active = true;

create table public.promo_code_usage (
  id             uuid primary key default gen_random_uuid(),
  promo_code_id  uuid not null references public.promo_codes(id) on delete cascade,
  order_id       uuid not null references public.orders(id) on delete cascade,
  user_id        uuid not null references public.profiles(id),
  discount_amount integer not null check (discount_amount >= 0),
  created_at     timestamptz not null default now(),
  unique(promo_code_id, order_id)
);

create index idx_promo_code_usage_promo on public.promo_code_usage(promo_code_id);
create index idx_promo_code_usage_order on public.promo_code_usage(order_id);
create index idx_promo_code_usage_user  on public.promo_code_usage(user_id);

alter table public.promo_codes       enable row level security;
alter table public.promo_code_usage  enable row level security;

create policy "promo_codes: public read active"   on public.promo_codes for select using (active = true and now() between valid_from and valid_to);
create policy "promo_codes: organizer manage"     on public.promo_codes for all using (exists (select 1 from public.events where id = event_id and organizer_id = auth.uid())) with check (exists (select 1 from public.events where id = event_id and organizer_id = auth.uid()));
create policy "promo_codes: admin read"           on public.promo_codes for select using (public.current_user_role() = 'admin');
create policy "promo_code_usage: user read own"   on public.promo_code_usage for select using (user_id = auth.uid());
create policy "promo_code_usage: organizer read"  on public.promo_code_usage for select using (exists (select 1 from public.promo_codes pc join public.events e on e.id = pc.event_id where pc.id = promo_code_id and e.organizer_id = auth.uid()));

create trigger set_promo_codes_updated_at before update on public.promo_codes for each row execute function update_updated_at();

create or replace function validate_promo_code(p_code text, p_event_id uuid, p_ticket_count integer, p_subtotal integer)
returns table (valid boolean, promo_code_id uuid, discount_amount integer, error text)
language plpgsql security definer as $$
declare v_promo record; v_discount integer;
begin
  select * into v_promo from public.promo_codes where event_id = p_event_id and upper(code) = upper(p_code) and active = true;
  if v_promo is null then return query select false, null::uuid, 0, 'Invalid promo code'::text; return; end if;
  if now() < v_promo.valid_from then return query select false, null::uuid, 0, 'Promo code not yet valid'::text; return; end if;
  if now() > v_promo.valid_to then return query select false, null::uuid, 0, 'Promo code has expired'::text; return; end if;
  if v_promo.usage_limit is not null and v_promo.used_count >= v_promo.usage_limit then return query select false, null::uuid, 0, 'Promo code has reached its usage limit'::text; return; end if;
  if v_promo.min_tickets is not null and p_ticket_count < v_promo.min_tickets then return query select false, null::uuid, 0, format('Minimum %s tickets required', v_promo.min_tickets)::text; return; end if;
  if v_promo.discount_type = 'percentage' then v_discount := floor(p_subtotal * v_promo.discount_value / 100.0);
  else v_discount := v_promo.discount_value; end if;
  if v_promo.max_discount is not null and v_discount > v_promo.max_discount then v_discount := v_promo.max_discount; end if;
  if v_discount > p_subtotal then v_discount := p_subtotal; end if;
  return query select true, v_promo.id, v_discount, null::text;
end; $$;

create or replace function increment_promo_code_usage(p_promo_code_id uuid)
returns void language plpgsql security definer as $$
begin update public.promo_codes set used_count = used_count + 1 where id = p_promo_code_id; end; $$;

-- =============================================================================
-- 016: WAITLIST FUNCTIONS
-- =============================================================================

create or replace function get_next_waitlist_position(p_event_id uuid)
returns integer language plpgsql as $$
declare v_max integer;
begin
  select coalesce(max(waitlist_position), 0) into v_max from public.registrations where event_id = p_event_id and status = 'waitlist';
  return v_max + 1;
end; $$;

create or replace function add_to_waitlist(p_event_id uuid, p_user_id uuid, p_ticket_type_id uuid, p_quantity integer default 1)
returns table (success boolean, registration_id uuid, queue_position integer, error text)
language plpgsql security definer as $$
declare v_reg_id uuid; v_pos integer; v_count integer;
begin
  select count(*) into v_count from public.registrations where event_id = p_event_id and user_id = p_user_id and status = 'waitlist';
  if v_count > 0 then return query select false, null::uuid, 0, 'Already on waitlist for this event'::text; return; end if;
  select count(*) into v_count from public.registrations where event_id = p_event_id and user_id = p_user_id and status = 'active';
  if v_count > 0 then return query select false, null::uuid, 0, 'Already registered for this event'::text; return; end if;
  v_pos := get_next_waitlist_position(p_event_id);
  insert into public.registrations (event_id, user_id, ticket_type_id, quantity, status, waitlist_position)
  values (p_event_id, p_user_id, p_ticket_type_id, p_quantity, 'waitlist', v_pos)
  returning id into v_reg_id;
  return query select true, v_reg_id, v_pos, null::text;
end; $$;

create or replace function get_event_waitlist(p_event_id uuid, p_limit integer default null)
returns table (id uuid, user_id uuid, user_email text, user_name text, ticket_type_id uuid, ticket_type_name text, quantity integer, waitlist_position integer, notified_at timestamptz, created_at timestamptz)
language plpgsql security definer as $$
begin
  return query
  select r.id, r.user_id, p.email, p.full_name, r.ticket_type_id, tt.name, r.quantity, r.waitlist_position, r.notified_at, r.created_at
  from public.registrations r
  join public.profiles p on p.id = r.user_id
  join public.ticket_types tt on tt.id = r.ticket_type_id
  where r.event_id = p_event_id and r.status = 'waitlist'
  order by r.waitlist_position asc
  limit p_limit;
end; $$;

create or replace function mark_waitlist_notified(p_registration_id uuid)
returns void language plpgsql security definer as $$
begin update public.registrations set notified_at = now() where id = p_registration_id and status = 'waitlist'; end; $$;

create or replace function convert_waitlist_to_active(p_registration_id uuid, p_order_id uuid)
returns boolean language plpgsql security definer as $$
declare v_event_id uuid; v_ticket_type_id uuid; v_quantity integer; v_available integer;
begin
  select event_id, ticket_type_id, quantity into v_event_id, v_ticket_type_id, v_quantity
  from public.registrations where id = p_registration_id and status = 'waitlist';
  if not found then return false; end if;
  select capacity - sold into v_available from public.ticket_types where id = v_ticket_type_id;
  if v_available < v_quantity then return false; end if;
  update public.registrations set status = 'active', waitlist_position = null, updated_at = now() where id = p_registration_id;
  update public.ticket_types set sold = sold + v_quantity where id = v_ticket_type_id;
  return true;
end; $$;

create or replace function remove_from_waitlist(p_registration_id uuid, p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare v_pos integer; v_event_id uuid;
begin
  select waitlist_position, event_id into v_pos, v_event_id from public.registrations where id = p_registration_id and user_id = p_user_id and status = 'waitlist';
  if not found then return false; end if;
  delete from public.registrations where id = p_registration_id;
  update public.registrations set waitlist_position = waitlist_position - 1 where event_id = v_event_id and status = 'waitlist' and waitlist_position > v_pos;
  return true;
end; $$;

-- =============================================================================
-- 017: PERFORMANCE INDEXES
-- =============================================================================

create index if not exists idx_transfers_from_user_id     on public.ticket_transfers(from_user_id);
create index if not exists idx_transfers_to_user_id       on public.ticket_transfers(to_user_id);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread       on public.notifications(user_id, read_at) where read_at is null;
create index if not exists idx_refunds_order_created      on public.refunds(order_id, created_at desc);
create index if not exists idx_promo_codes_event_active   on public.promo_codes(event_id, active, valid_to);
create index if not exists idx_orders_user_created        on public.orders(user_id, created_at desc);
create index if not exists idx_orders_event_status        on public.orders(event_id, status, created_at desc);
create index if not exists idx_registrations_user_waitlist on public.registrations(user_id, status, created_at desc) where status = 'waitlist';

analyze public.events;
analyze public.tickets;
analyze public.orders;
analyze public.notifications;
analyze public.registrations;

-- =============================================================================
-- SEED: CATEGORIES (starter data)
-- =============================================================================

insert into public.event_categories (name, slug, description) values
  ('Music',        'music',        'Concerts, festivals, and live music events'),
  ('Technology',   'technology',   'Tech conferences, hackathons, and meetups'),
  ('Sports',       'sports',       'Sporting events and fitness activities'),
  ('Arts',         'arts',         'Art exhibitions, theatre, and cultural events'),
  ('Business',     'business',     'Networking events, conferences, and workshops'),
  ('Food & Drink', 'food-drink',   'Food festivals, wine tastings, and culinary events'),
  ('Health',       'health',       'Wellness, yoga, and health conferences'),
  ('Education',    'education',    'Workshops, seminars, and training sessions'),
  ('Comedy',       'comedy',       'Stand-up comedy shows and improv nights'),
  ('Community',    'community',    'Local meetups and community gatherings')
on conflict (slug) do nothing;

-- =============================================================================
-- DONE ✅
-- =============================================================================
