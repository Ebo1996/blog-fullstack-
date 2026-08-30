/**
 * File upload utilities for Supabase Storage
 * 
 * Handles:
 * - Event images (organizers only)
 * - User avatars (own avatar only)
 * - Image optimization and validation
 */

import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Configuration ────────────────────────────────────────────────────────────

const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const storageConfig = {
  eventImages: {
    bucket: 'event-images',
    maxSize: MAX_EVENT_IMAGE_SIZE,
    allowedTypes: ALLOWED_IMAGE_TYPES,
  },
  avatars: {
    bucket: 'avatars',
    maxSize: MAX_AVATAR_SIZE,
    allowedTypes: ALLOWED_IMAGE_TYPES,
  },
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateImage(file: File, maxSize: number): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    }
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)} MB`,
    }
  }

  return { valid: true }
}

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${timestamp}-${random}.${ext}`
}

// ─── Event Image Upload ───────────────────────────────────────────────────────

export async function uploadEventImage(
  file: File,
  eventId: string,
): Promise<UploadResult> {
  // Validate
  const validation = validateImage(file, MAX_EVENT_IMAGE_SIZE)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const supabase = createClient()

  // Generate unique filename
  const fileName = generateFileName(file.name)
  const filePath = `${eventId}/${fileName}`

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (err) {
    console.error('[storage] Event image upload failed:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────

export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<UploadResult> {
  // Validate
  const validation = validateImage(file, MAX_AVATAR_SIZE)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const supabase = createClient()

  // Use consistent filename for avatars (overwrite existing)
  const fileName = 'avatar.jpg' // Always use same name to overwrite
  const filePath = `${userId}/${fileName}`

  try {
    // Delete existing avatar first
    await supabase.storage.from('avatars').remove([filePath])

    // Upload new avatar
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    // Add timestamp to URL to bust cache
    const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`

    return {
      success: true,
      url: urlWithTimestamp,
      path: data.path,
    }
  } catch (err) {
    console.error('[storage] Avatar upload failed:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

// ─── Delete Functions ─────────────────────────────────────────────────────────

export async function deleteEventImage(filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage
      .from('event-images')
      .remove([filePath])

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error('[storage] Event image deletion failed:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Deletion failed',
    }
  }
}

export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/avatar.jpg`])

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error('[storage] Avatar deletion failed:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Deletion failed',
    }
  }
}

// ─── Server-side Upload (for API routes) ─────────────────────────────────────

export async function uploadEventImageServer(
  file: File,
  eventId: string,
): Promise<UploadResult> {
  // Validate
  const validation = validateImage(file, MAX_EVENT_IMAGE_SIZE)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const supabase = createServiceClient()

  // Generate unique filename
  const fileName = generateFileName(file.name)
  const filePath = `${eventId}/${fileName}`

  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (err) {
    console.error('[storage] Server event image upload failed:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

// ─── Helper: Get public URL ───────────────────────────────────────────────────

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
