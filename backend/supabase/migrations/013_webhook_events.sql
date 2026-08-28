-- ─────────────────────────────────────────────────────────────────────────────
-- 013_webhook_events.sql
-- Idempotency table for Stripe webhook events.
-- Prevents duplicate processing when Stripe retries delivery.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.processed_webhook_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text not null unique,
  event_type       text not null,
  processed_at     timestamptz not null default now()
);

comment on table public.processed_webhook_events
  is 'Tracks processed Stripe webhook events to prevent duplicate handling.';

create index idx_webhook_events_stripe_id
  on public.processed_webhook_events(stripe_event_id);

-- Only the service role (webhook handler) can write to this table.
-- No client access needed.
alter table public.processed_webhook_events enable row level security;

-- No SELECT/INSERT policies for authenticated/anon — service role bypasses RLS.
