/**
 * Event image upload API
 * 
 * POST /api/upload/event-image
 * Body: FormData with 'file' and 'eventId'
 * 
 * Validates user is organizer and uploads to Supabase Storage
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadEventImageServer } from '@/lib/storage'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'

  return withRateLimit(
    `upload-event-image:${ip}`,
    RATE_LIMITS.API_DEFAULT,
    async () => {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user is organizer or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (!profile || !['organizer', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Missing file or eventId' }, { status: 400 })
    }

    // Verify user owns the event
    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', eventId)
      .single<{ id: string; organizer_id: string }>()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizer_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Not your event' }, { status: 403 })
    }

    // Upload file
    const result = await uploadEventImageServer(file, eventId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Update event with new image URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('events')
      .update({ image_url: result.url, updated_at: new Date().toISOString() })
      .eq('id', eventId)

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    })
  } catch (err) {
    console.error('[upload/event-image] Error:', err)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 },
    )
  }
    },
  )
}
