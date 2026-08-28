-- ─────────────────────────────────────────────────────────────────────────────
-- 012_storage.sql
-- Supabase Storage buckets and access policies.
-- Buckets: event-images (public), avatars (public read / owner write)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Create buckets ───────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'event-images',
    'event-images',
    true,                    -- publicly readable via CDN URL
    5242880,                 -- 5 MB max per file
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'avatars',
    'avatars',
    true,                    -- publicly readable
    2097152,                 -- 2 MB max per file
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT IMAGES BUCKET POLICIES
-- Path convention: event-images/{event_id}/{filename}
-- Only the event organizer (or admin) can upload/delete for their event.
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone can read event images (bucket is public)
create policy "event-images: public read"
  on storage.objects for select
  using (bucket_id = 'event-images');

-- Organizer can upload to their event folder
create policy "event-images: organizer upload"
  on storage.objects for insert
  with check (
    bucket_id = 'event-images'
    and auth.role() = 'authenticated'
    -- Path must be: {event_id}/{filename}
    -- Event must belong to the uploading user
    and exists (
      select 1 from public.events e
      where e.id::text = split_part(name, '/', 1)
        and e.organizer_id = auth.uid()
    )
  );

-- Organizer can update (replace) their event images
create policy "event-images: organizer update"
  on storage.objects for update
  using (
    bucket_id = 'event-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.events e
      where e.id::text = split_part(name, '/', 1)
        and e.organizer_id = auth.uid()
    )
  );

-- Organizer can delete their event images; admin can delete any
create policy "event-images: organizer delete"
  on storage.objects for delete
  using (
    bucket_id = 'event-images'
    and auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.events e
        where e.id::text = split_part(name, '/', 1)
          and e.organizer_id = auth.uid()
      )
      or public.current_user_role() = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- AVATARS BUCKET POLICIES
-- Path convention: avatars/{user_id}/{filename}
-- Users can only manage their own avatar folder.
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone can read avatars
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated user can upload to their own folder only
create policy "avatars: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Owner can replace their avatar
create policy "avatars: owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Owner or admin can delete
create policy "avatars: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.current_user_role() = 'admin'
    )
  );
