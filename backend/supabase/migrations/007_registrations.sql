-- ─────────────────────────────────────────────────────────────────────────────
-- 007_registrations.sql
-- Free RSVP / waitlist registrations (separate from paid ticket orders).
-- ─────────────────────────────────────────────────────────────────────────────

create type public.registration_status as enum ('confirmed', 'cancelled', 'waitlisted');

create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      public.registration_status not null default 'confirmed',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One RSVP per user per event
  constraint registrations_unique_rsvp unique (event_id, user_id)
);

comment on table public.registrations is 'RSVP/waitlist records. One per user per event.';

create trigger registrations_updated_at
  before update on public.registrations
  for each row execute procedure public.touch_updated_at();

create index idx_registrations_user_id  on public.registrations(user_id);
create index idx_registrations_event_id on public.registrations(event_id);
create index idx_registrations_status   on public.registrations(event_id, status);
