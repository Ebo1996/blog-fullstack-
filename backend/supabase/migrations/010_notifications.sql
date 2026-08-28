-- ─────────────────────────────────────────────────────────────────────────────
-- 010_notifications.sql
-- In-app notifications. Created server-side only (service role or RPC).
-- ─────────────────────────────────────────────────────────────────────────────

create type public.notification_type as enum (
  'ticket_purchased',
  'payment_completed',
  'payment_failed',
  'event_reminder',
  'ticket_transfer_received',
  'ticket_transfer_accepted',
  'ticket_transfer_rejected',
  'event_updated',
  'event_cancelled',
  'rsvp_confirmed',
  'rsvp_waitlisted'
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        public.notification_type not null,
  title       text not null,
  message     text not null,
  data        jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),

  constraint notifications_title_not_empty   check (char_length(title)   > 0),
  constraint notifications_message_not_empty check (char_length(message) > 0)
);

comment on table public.notifications is 'In-app notifications. Created server-side; users can mark as read.';

create index idx_notifications_user_id    on public.notifications(user_id, created_at desc);
create index idx_notifications_unread     on public.notifications(user_id, read_at)
  where read_at is null;

-- ─── Helper: create notification (called from other RPCs / webhook handler) ──
create or replace function public.create_notification(
  p_user_id  uuid,
  p_type     public.notification_type,
  p_title    text,
  p_message  text,
  p_data     jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, message, data)
  values (p_user_id, p_type, p_title, p_message, p_data);
end;
$$;
