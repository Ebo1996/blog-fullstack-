-- ─────────────────────────────────────────────────────────────────────────────
-- 002_categories.sql
-- Event categories. Managed by admins. Publicly readable.
-- ─────────────────────────────────────────────────────────────────────────────

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

comment on table public.event_categories is 'Platform-level event categories. Admin-managed.';

create trigger event_categories_updated_at
  before update on public.event_categories
  for each row execute procedure public.touch_updated_at();

create index idx_event_categories_slug on public.event_categories(slug);
