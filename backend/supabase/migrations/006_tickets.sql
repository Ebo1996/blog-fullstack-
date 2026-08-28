-- ─────────────────────────────────────────────────────────────────────────────
-- 006_tickets.sql
-- One ticket record per purchased seat. QR token is a secure random value.
-- ─────────────────────────────────────────────────────────────────────────────

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

  constraint tickets_ticket_code_not_empty  check (char_length(ticket_code) > 0),
  constraint tickets_qr_token_length        check (char_length(qr_token) >= 32),
  -- checked_in_at only set when status = 'used'
  constraint tickets_checkin_consistency    check (
    (status = 'used' and checked_in_at is not null) or
    (status <> 'used' and checked_in_at is null)
  )
);

comment on table public.tickets is 'One row per purchased ticket seat. qr_token is the scan target.';
comment on column public.tickets.qr_token is 'Random 48-char token. Never encodes sensitive data.';
comment on column public.tickets.ticket_code is 'Human-readable code shown on ticket, e.g. NS-XXXXXXXX.';

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.touch_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index idx_tickets_user_id       on public.tickets(user_id);
create index idx_tickets_event_id      on public.tickets(event_id);
create index idx_tickets_order_id      on public.tickets(order_id);
create index idx_tickets_ticket_code   on public.tickets(ticket_code);
create index idx_tickets_qr_token      on public.tickets(qr_token);  -- critical for scanner
create index idx_tickets_status        on public.tickets(status);
create index idx_tickets_event_status  on public.tickets(event_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- ATOMIC PURCHASE RPC
-- Handles: inventory check → sold_quantity increment → ticket + order item creation
-- Uses FOR UPDATE to prevent race conditions under concurrent purchases.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.purchase_tickets(
  p_order_id uuid,
  p_items    jsonb   -- [{ticket_type_id, quantity, unit_price}]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item          record;
  tt            record;
  ticket_rec    record;
  new_ticket_id uuid;
  i             integer;
  ticket_code   text;
  qr_token      text;
  result        jsonb;
begin
  -- Validate the order exists and belongs to the calling user
  if not exists (
    select 1 from public.orders
    where id = p_order_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  end if;

  for item in select * from jsonb_to_recordset(p_items)
    as x(ticket_type_id uuid, quantity integer, unit_price integer)
  loop
    -- Lock the ticket type row to prevent concurrent oversell
    select * into tt
    from public.ticket_types
    where id = item.ticket_type_id
    for update;

    if not found then
      return jsonb_build_object('success', false, 'error', 'Ticket type not found: ' || item.ticket_type_id);
    end if;

    if tt.status = 'inactive' then
      return jsonb_build_object('success', false, 'error', 'Ticket type is not available');
    end if;

    if (tt.sold_quantity + item.quantity) > tt.quantity then
      return jsonb_build_object(
        'success', false,
        'error', 'Not enough tickets available for: ' || tt.name
      );
    end if;

    -- Insert order item
    insert into public.order_items (order_id, ticket_type_id, quantity, unit_price, subtotal)
    values (
      p_order_id,
      item.ticket_type_id,
      item.quantity,
      item.unit_price,
      item.unit_price * item.quantity
    );

    -- Increment sold quantity (triggers auto_update_ticket_type_status)
    update public.ticket_types
    set sold_quantity = sold_quantity + item.quantity
    where id = item.ticket_type_id;

    -- Create one ticket row per seat
    for i in 1..item.quantity loop
      -- Secure random ticket_code: NS- + 8 hex chars
      ticket_code := 'NS-' || upper(substring(encode(gen_random_bytes(8), 'hex') for 8));
      -- Secure random qr_token: 48 hex chars
      qr_token    := encode(gen_random_bytes(24), 'hex');

      -- Guarantee uniqueness (extremely unlikely collision but safe)
      while exists (select 1 from public.tickets where tickets.ticket_code = ticket_code) loop
        ticket_code := 'NS-' || upper(substring(encode(gen_random_bytes(8), 'hex') for 8));
      end loop;

      while exists (select 1 from public.tickets where tickets.qr_token = qr_token) loop
        qr_token := encode(gen_random_bytes(24), 'hex');
      end loop;

      insert into public.tickets (
        order_id, event_id, ticket_type_id, user_id, ticket_code, qr_token
      )
      select
        p_order_id,
        tt.event_id,
        item.ticket_type_id,
        o.user_id,
        ticket_code,
        qr_token
      from public.orders o
      where o.id = p_order_id;
    end loop;
  end loop;

  return jsonb_build_object('success', true);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ATOMIC CHECK-IN RPC
-- Validates QR token and atomically marks ticket as used.
-- Prevents double check-in under concurrent scanner use.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.validate_and_checkin(
  p_qr_token       text,
  p_event_id       uuid,
  p_checked_in_by  uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_rec  record;
  tt_name     text;
  user_name   text;
begin
  -- Lock the ticket row immediately
  select t.*, tt.name as type_name, p.full_name as attendee_name
  into ticket_rec
  from public.tickets t
  join public.ticket_types tt on tt.id = t.ticket_type_id
  join public.profiles p      on p.id  = t.user_id
  where t.qr_token = p_qr_token
  for update;

  -- Token not found
  if not found then
    return jsonb_build_object(
      'success', false,
      'status',  'invalid'
    );
  end if;

  -- Wrong event
  if ticket_rec.event_id <> p_event_id then
    return jsonb_build_object(
      'success', false,
      'status',  'wrong_event'
    );
  end if;

  -- Verify the scanner is authorized (organizer of this event or admin)
  if not exists (
    select 1 from public.events e
    join public.profiles p on p.id = p_checked_in_by
    where e.id = p_event_id
    and (e.organizer_id = p_checked_in_by or p.role = 'admin')
  ) then
    return jsonb_build_object(
      'success', false,
      'status',  'unauthorized'
    );
  end if;

  -- Already checked in
  if ticket_rec.status = 'used' then
    return jsonb_build_object(
      'success',        false,
      'status',         'already_checked_in',
      'ticket_id',      ticket_rec.id,
      'attendee_name',  ticket_rec.attendee_name,
      'ticket_type',    ticket_rec.type_name,
      'checked_in_at',  ticket_rec.checked_in_at
    );
  end if;

  -- Status checks
  if ticket_rec.status = 'cancelled' then
    return jsonb_build_object('success', false, 'status', 'cancelled');
  end if;

  if ticket_rec.status = 'expired' then
    return jsonb_build_object('success', false, 'status', 'expired');
  end if;

  if ticket_rec.status = 'transferred' then
    return jsonb_build_object('success', false, 'status', 'transferred');
  end if;

  -- ✅ Valid — atomically mark as used
  update public.tickets
  set status = 'used', checked_in_at = now()
  where id = ticket_rec.id;

  -- Write audit record
  insert into public.check_ins (ticket_id, event_id, checked_in_by)
  values (ticket_rec.id, p_event_id, p_checked_in_by);

  return jsonb_build_object(
    'success',        true,
    'status',         'valid',
    'ticket_id',      ticket_rec.id,
    'attendee_name',  ticket_rec.attendee_name,
    'ticket_type',    ticket_rec.type_name
  );
end;
$$;
