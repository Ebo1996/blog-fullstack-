-- ─────────────────────────────────────────────────────────────────────────────
-- 001_profiles.sql
-- User profiles linked to Supabase Auth users.
-- Role is set at registration and can only be changed by an admin via RPC.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.user_role as enum ('attendee', 'organizer', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'attendee',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. Role controls dashboard access.';
comment on column public.profiles.role is 'attendee | organizer | admin. Cannot be self-escalated.';

-- Auto-create profile on new auth user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'attendee'::public.user_role
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on profile changes
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ─── RPC: Admin-only role change ─────────────────────────────────────────────
-- Users cannot call this directly — enforced by RLS + SECURITY DEFINER check.
create or replace function public.admin_set_user_role(
  target_user_id uuid,
  new_role        public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role public.user_role;
begin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role <> 'admin' then
    raise exception 'Only admins can change user roles';
  end if;

  update public.profiles
  set role = new_role, updated_at = now()
  where id = target_user_id;
end;
$$;
