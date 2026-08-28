-- ─────────────────────────────────────────────────────────────────────────────
-- 003_events.sql
-- Events created and owned by organizers.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  organizer_id    uuid not null references public.profiles(id) on delete restrict,
  category_id     uuid references public.event_categories(id) on delete set null,
  title           text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  venue_name      text,
  venue_address   text,
  city            text,
  country         text,
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  capacity        integer,
  status          public.event_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint events_title_not_empty     check (char_length(title) >= 1),
  constraint events_end_after_start     check (end_at > start_at),
  constraint events_capacity_positive   check (capacity is null or capacity > 0),
  constraint events_slug_format         check (slug ~ '^[a-z0-9-]+$'),
  -- Published events must have required fields
  constraint events_published_requires_fields check (
    status <> 'published'
    or (
      venue_name    is not null and char_length(venue_name)  > 0 and
      venue_address is not null and char_length(venue_address) > 0 and
      city          is not null and char_length(city)        > 0 and
      country       is not null and char_length(country)     > 0 and
      description   is not null and char_length(description) > 0 and
      category_id   is not null
    )
  )
);

comment on table public.events is 'Events created by organizers. Status controls visibility.';

create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.touch_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index idx_events_organizer_id  on public.events(organizer_id);
create index idx_events_category_id   on public.events(category_id);
create index idx_events_status        on public.events(status);
create index idx_events_start_at      on public.events(start_at);
create index idx_events_city          on public.events(city);
create index idx_events_slug          on public.events(slug);
-- Compound: public discovery query (published, upcoming, by date)
create index idx_events_public        on public.events(status, start_at)
  where status = 'published';
