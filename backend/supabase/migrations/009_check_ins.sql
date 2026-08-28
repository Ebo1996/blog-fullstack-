-- ─────────────────────────────────────────────────────────────────────────────
-- 009_check_ins.sql
-- Immutable audit trail of all check-in events.
-- Written only by validate_and_checkin() RPC — never directly by client.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.check_ins (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.tickets(id) on delete cascade,
  event_id        uuid not null references public.events(id) on delete cascade,
  checked_in_by   uuid not null references public.profiles(id) on delete restrict,
  checked_in_at   timestamptz not null default now()
);

comment on table public.check_ins is 'Immutable check-in audit trail. Only written by validate_and_checkin() RPC.';

-- Each ticket can only have one check-in record
create unique index idx_check_ins_ticket_unique on public.check_ins(ticket_id);

create index idx_check_ins_event_id      on public.check_ins(event_id);
create index idx_check_ins_checked_in_by on public.check_ins(checked_in_by);
create index idx_check_ins_checked_in_at on public.check_ins(event_id, checked_in_at desc);
