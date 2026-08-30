/**
 * Avatar upload API
 * 
 * POST /api/upload/avatar
 * Body: FormData with 'file'
 * 
 * Uploads user avatar to Supabase Storage
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'

  return withRateLimit(
    `upload-avatar:${ip}`,
    RATE_LIMITS.API_DEFAULT,
    async () => {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 2 MB' },
        { status: 400 },
      )
    }

    const service = createServiceClient()
    const filePath = `${user.id}/avatar.jpg`

    // Delete existing avatar
    await service.storage.from('avatars').remove([filePath])

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload new avatar
    const { data, error: uploadError } = await service.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = service.storage
      .from('avatars')
      .getPublicUrl(data.path)

    const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`

    // Update user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('profiles')
      .update({
        avatar_url: urlWithTimestamp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      url: urlWithTimestamp,
      path: data.path,
    })
  } catch (err) {
    console.error('[upload/avatar] Error:', err)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 },
    )
  }
    },
  )
}
