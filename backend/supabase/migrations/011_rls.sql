-- ─────────────────────────────────────────────────────────────────────────────
-- 011_rls.sql
-- Row Level Security policies for every table.
-- Philosophy:
--   • Default DENY — enable RLS on every table first
--   • Public data: published events, categories (read-only, no auth required)
--   • User data: strict owner-only access
--   • Organizer data: only their own events and related rows
--   • Admin: platform-wide read + management
--   • Service-role key bypasses RLS (used for webhooks / trusted server ops)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Helper: get current user role safely ────────────────────────────────────
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users read their own profile
create policy "profiles: owner can read"
  on public.profiles for select
  using (id = auth.uid());

-- Admins read all profiles
create policy "profiles: admin can read all"
  on public.profiles for select
  using (public.current_user_role() = 'admin');

-- Users update their own profile (cannot change role — enforced by check below)
create policy "profiles: owner can update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Prevent self-escalation: role must stay the same unless admin
    and (
      role = (select role from public.profiles where id = auth.uid())
      or public.current_user_role() = 'admin'
    )
  );

-- Admins can update any profile (role changes done via admin_set_user_role RPC)
create policy "profiles: admin can update all"
  on public.profiles for update
  using (public.current_user_role() = 'admin');

-- Profile is auto-inserted by handle_new_user() trigger (security definer)
-- No INSERT policy needed for anon/authenticated roles

-- ═══════════════════════════════════════════════════════════════════════════════
-- EVENT CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Anyone can read categories
create policy "categories: public read"
  on public.event_categories for select
  using (true);

-- Only admins can manage categories
create policy "categories: admin insert"
  on public.event_categories for insert
  with check (public.current_user_role() = 'admin');

create policy "categories: admin update"
  on public.event_categories for update
  using (public.current_user_role() = 'admin');

create policy "categories: admin delete"
  on public.event_categories for delete
  using (public.current_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- EVENTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Public read: only published events
create policy "events: public read published"
  on public.events for select
  using (status = 'published');

-- Organizer reads their own events (all statuses)
create policy "events: organizer reads own"
  on public.events for select
  using (organizer_id = auth.uid());

-- Admin reads all events
create policy "events: admin read all"
  on public.events for select
  using (public.current_user_role() = 'admin');

-- Organizers create events (they become the owner)
create policy "events: organizer insert"
  on public.events for insert
  with check (
    organizer_id = auth.uid()
    and public.current_user_role() in ('organizer', 'admin')
  );

-- Organizers update only their own events
create policy "events: organizer update own"
  on public.events for update
  using (
    organizer_id = auth.uid()
    and public.current_user_role() in ('organizer', 'admin')
  );

-- Admins can update any event (e.g., suspend)
create policy "events: admin update all"
  on public.events for update
  using (public.current_user_role() = 'admin');

-- Only organizer can delete their own draft events; admin can delete any
create policy "events: organizer delete own draft"
  on public.events for delete
  using (
    organizer_id = auth.uid()
    and status = 'draft'
    and public.current_user_role() in ('organizer', 'admin')
  );

create policy "events: admin delete any"
  on public.events for delete
  using (public.current_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- TICKET TYPES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Public reads active ticket types for published events
create policy "ticket_types: public read active"
  on public.ticket_types for select
  using (
    status <> 'inactive'
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published'
    )
  );

-- Organizer reads all their ticket types (including inactive)
create policy "ticket_types: organizer reads own"
  on public.ticket_types for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "ticket_types: admin read all"
  on public.ticket_types for select
  using (public.current_user_role() = 'admin');

-- Organizer manages ticket types for their events
create policy "ticket_types: organizer insert"
  on public.ticket_types for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
    and public.current_user_role() in ('organizer', 'admin')
  );

create policy "ticket_types: organizer update own"
  on public.ticket_types for update
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "ticket_types: admin update all"
  on public.ticket_types for update
  using (public.current_user_role() = 'admin');

create policy "ticket_types: organizer delete own"
  on public.ticket_types for delete
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
    and public.current_user_role() in ('organizer', 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Attendee reads own orders
create policy "orders: attendee read own"
  on public.orders for select
  using (user_id = auth.uid());

-- Organizer reads orders for their events
create policy "orders: organizer read for own events"
  on public.orders for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "orders: admin read all"
  on public.orders for select
  using (public.current_user_role() = 'admin');

-- Orders created by authenticated users only (server-side action)
create policy "orders: authenticated insert"
  on public.orders for insert
  with check (user_id = auth.uid());

-- Only server-side (service role) or admin updates order status
create policy "orders: admin update"
  on public.orders for update
  using (public.current_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER ITEMS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Attendee reads items for their orders
create policy "order_items: attendee read own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- Organizer reads items for their event orders
create policy "order_items: organizer read for own events"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      join public.events e on e.id = o.event_id
      where o.id = order_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "order_items: admin read all"
  on public.order_items for select
  using (public.current_user_role() = 'admin');

-- Insert via purchase_tickets() RPC (security definer — bypasses RLS)
-- No direct INSERT policy needed for client role

-- ═══════════════════════════════════════════════════════════════════════════════
-- TICKETS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Attendee reads own tickets
create policy "tickets: attendee read own"
  on public.tickets for select
  using (user_id = auth.uid());

-- Organizer reads tickets for their events
create policy "tickets: organizer read for own events"
  on public.tickets for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "tickets: admin read all"
  on public.tickets for select
  using (public.current_user_role() = 'admin');

-- Tickets created by purchase_tickets() RPC only (security definer)
-- No direct INSERT for client role

-- ═══════════════════════════════════════════════════════════════════════════════
-- REGISTRATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Attendee reads own RSVPs
create policy "registrations: attendee read own"
  on public.registrations for select
  using (user_id = auth.uid());

-- Organizer reads RSVPs for their events
create policy "registrations: organizer read for own events"
  on public.registrations for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "registrations: admin read all"
  on public.registrations for select
  using (public.current_user_role() = 'admin');

-- Authenticated users create their own RSVPs
create policy "registrations: authenticated insert"
  on public.registrations for insert
  with check (user_id = auth.uid());

-- Users can cancel their own RSVPs
create policy "registrations: owner update own"
  on public.registrations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- TICKET TRANSFERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sender and recipient can read their transfers
create policy "transfers: parties read own"
  on public.ticket_transfers for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- Organizer reads transfers for their event tickets
create policy "transfers: organizer read for own events"
  on public.ticket_transfers for select
  using (
    exists (
      select 1 from public.tickets t
      join public.events e on e.id = t.event_id
      where t.id = ticket_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "transfers: admin read all"
  on public.ticket_transfers for select
  using (public.current_user_role() = 'admin');

-- Sender initiates transfer (must own the ticket)
create policy "transfers: owner insert"
  on public.ticket_transfers for insert
  with check (
    from_user_id = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.user_id = auth.uid()
        and t.status = 'active'
    )
  );

-- Recipient accepts/rejects; sender can cancel — handled via RPC
create policy "transfers: parties update"
  on public.ticket_transfers for update
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHECK-INS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Attendee can see their own check-in records
create policy "check_ins: attendee read own"
  on public.check_ins for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

-- Organizer reads check-ins for their events
create policy "check_ins: organizer read for own events"
  on public.check_ins for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- Admin reads all
create policy "check_ins: admin read all"
  on public.check_ins for select
  using (public.current_user_role() = 'admin');

-- Insert only via validate_and_checkin() RPC (security definer)
-- No direct INSERT for client role

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users read only their own notifications
create policy "notifications: owner read own"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users mark their own notifications as read
create policy "notifications: owner update own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Insert only via create_notification() RPC or service role (webhooks)
-- Admin can read all for support purposes
create policy "notifications: admin read all"
  on public.notifications for select
  using (public.current_user_role() = 'admin');
