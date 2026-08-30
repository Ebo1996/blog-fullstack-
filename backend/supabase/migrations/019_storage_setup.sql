-- ============================================================================
-- Migration: Configure Supabase Storage for file uploads
-- ============================================================================
-- Purpose: Set up storage buckets and RLS policies for:
--          - Event images
--          - User avatars
--          - Event organizer logos
-- Date: 2026-08-30
-- ============================================================================

BEGIN;

-- ─── Create Storage Buckets ───────────────────────────────────────────────────

-- Event images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS Policies ─────────────────────────────────────────────────────

-- Event Images: Anyone can view, organizers can upload for their events
CREATE POLICY "Event images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Organizers can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('organizer', 'admin')
    )
  );

CREATE POLICY "Organizers can update their event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('organizer', 'admin')
    )
  );

CREATE POLICY "Organizers can delete their event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('organizer', 'admin')
    )
  );

-- Avatars: Anyone can view, users can upload/update their own avatar
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;

-- ============================================================================
-- Usage Examples:
-- ============================================================================
-- Event image path: event-images/event-id/image-name.jpg
-- Avatar path: avatars/user-id/avatar.jpg
--
-- Upload from Next.js:
--   const { data, error } = await supabase.storage
--     .from('event-images')
--     .upload(`${eventId}/${file.name}`, file)
--
-- Get public URL:
--   const { data } = supabase.storage
--     .from('event-images')
--     .getPublicUrl(`${eventId}/${file.name}`)
-- ============================================================================
