# File Upload Configuration

This document explains how file uploads work in the platform using Supabase Storage.

## Overview

The platform supports two types of uploads:
1. **Event images** - Cover images for events (organizers only)
2. **User avatars** - Profile pictures (all users)

## Storage Buckets

### `event-images`
- **Access:** Public (anyone can view)
- **Upload:** Organizers and admins only
- **Max size:** 5 MB
- **Formats:** JPEG, PNG, WebP
- **Path structure:** `{eventId}/{timestamp-random}.{ext}`

### `avatars`
- **Access:** Public (anyone can view)
- **Upload:** Users can upload their own avatar
- **Max size:** 2 MB
- **Formats:** JPEG, PNG, WebP
- **Path structure:** `{userId}/avatar.jpg`

## Setup Instructions

### 1. Run Database Migration

The storage buckets and RLS policies are created automatically when you run:

```bash
cd backend
supabase db push
```

Or manually run the migration:

```sql
-- Run backend/supabase/migrations/019_storage_setup.sql
```

### 2. Verify Buckets

In Supabase Dashboard:
1. Go to **Storage**
2. You should see:
   - `event-images` bucket (public)
   - `avatars` bucket (public)

### 3. Test Upload

#### Upload Event Image (from organizer account):

```typescript
const formData = new FormData()
formData.append('file', imageFile)
formData.append('eventId', 'your-event-id')

const response = await fetch('/api/upload/event-image', {
  method: 'POST',
  body: formData,
})

const { success, url } = await response.json()
```

#### Upload Avatar:

```typescript
const formData = new FormData()
formData.append('file', imageFile)

const response = await fetch('/api/upload/avatar', {
  method: 'POST',
  body: formData,
})

const { success, url } = await response.json()
```

## Client-Side Usage

### Using the Storage Library

```typescript
import { uploadEventImage, uploadAvatar } from '@/lib/storage'

// Upload event image
const result = await uploadEventImage(file, eventId)
if (result.success) {
  console.log('Uploaded:', result.url)
}

// Upload avatar
const result = await uploadAvatar(file, userId)
if (result.success) {
  console.log('Uploaded:', result.url)
}
```

### Using API Routes (Recommended)

API routes handle authentication and authorization automatically:

```typescript
// Event image
const formData = new FormData()
formData.append('file', file)
formData.append('eventId', eventId)

const res = await fetch('/api/upload/event-image', {
  method: 'POST',
  body: formData,
})

// Avatar
const formData = new FormData()
formData.append('file', file)

const res = await fetch('/api/upload/avatar', {
  method: 'POST',
  body: formData,
})
```

## Security

### Row Level Security (RLS)

All storage operations are protected by RLS policies:

#### Event Images
- ✅ Anyone can view
- ✅ Organizers/admins can upload
- ✅ Organizers/admins can update
- ✅ Organizers/admins can delete
- ❌ Attendees cannot upload

#### Avatars
- ✅ Anyone can view
- ✅ Users can upload their own avatar only
- ✅ Users can update their own avatar only
- ✅ Users can delete their own avatar only
- ❌ Users cannot modify other users' avatars

### Validation

#### Server-side validation:
- File type (JPEG, PNG, WebP only)
- File size (5 MB for events, 2 MB for avatars)
- User authorization
- Event ownership (for event images)

#### Client-side validation:
- Same validations run before upload
- Provides immediate feedback

## URL Structure

### Public URLs

Event images:
```
https://{project-ref}.supabase.co/storage/v1/object/public/event-images/{eventId}/{filename}
```

Avatars:
```
https://{project-ref}.supabase.co/storage/v1/object/public/avatars/{userId}/avatar.jpg?t={timestamp}
```

Note: Avatars include a `?t={timestamp}` query parameter to bust cache after updates.

## Troubleshooting

### "Unauthorized" error
- User is not authenticated
- Check if user is logged in

### "Forbidden" error (event images)
- User is not an organizer or admin
- Check user's role in `profiles` table

### "Not your event" error
- User trying to upload image for event they don't own
- Verify `event.organizer_id` matches `user.id`

### "File too large" error
- Event images: max 5 MB
- Avatars: max 2 MB
- Compress image before uploading

### "Invalid file type" error
- Only JPEG, PNG, and WebP allowed
- Check `file.type` matches allowed types

### Images not loading
- Check if buckets are set to public
- Verify RLS policies allow SELECT
- Check browser console for CORS errors

## Best Practices

1. **Compress images** before upload to reduce size
2. **Use WebP format** for better compression
3. **Add loading states** while uploading
4. **Show upload progress** for better UX
5. **Handle errors gracefully** with user-friendly messages
6. **Cache bust** avatar URLs with timestamps
7. **Delete old images** when uploading new ones (avatars do this automatically)

## Migration Notes

If you have existing data with image URLs from external sources:
1. Upload images to Supabase Storage
2. Update `events.image_url` and `profiles.avatar_url`
3. Use the new Supabase Storage URLs

Example migration script:
```typescript
// Migrate event images
const events = await supabase.from('events').select('id, image_url')
for (const event of events.data) {
  if (event.image_url && !event.image_url.includes('supabase.co')) {
    // Download external image
    const response = await fetch(event.image_url)
    const blob = await response.blob()
    
    // Upload to Supabase Storage
    const result = await uploadEventImageServer(blob, event.id)
    
    // Update database
    await supabase
      .from('events')
      .update({ image_url: result.url })
      .eq('id', event.id)
  }
}
```

## Next Steps

- [ ] Add image cropping UI for avatars
- [ ] Add multiple image support for events (gallery)
- [ ] Add image optimization on upload (resize/compress)
- [ ] Add progress indicators for large uploads
- [ ] Add drag-and-drop upload UI
