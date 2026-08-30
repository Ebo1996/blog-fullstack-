import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ScanResponse } from '@/types'

const schema = z.object({
  qrToken: z.string().min(32),
  eventId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body   = await request.json() as unknown
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<ScanResponse>(
        { success: false, status: 'invalid' },
        { status: 400 },
      )
    }

    const { qrToken, eventId } = parsed.data

    // Auth — must be the event organizer or admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json<ScanResponse>(
        { success: false, status: 'invalid' },
        { status: 401 },
      )
    }

    // Verify the caller is authorized for this event
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>()

    if (profile?.role !== 'admin') {
      const { data: eventOwner } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single<{ id: string }>()

      if (!eventOwner) {
        return NextResponse.json<ScanResponse>(
          { success: false, status: 'invalid' },
          { status: 403 },
        )
      }
    }

    // Call the atomic validate_and_checkin RPC via service client
    // (service client so it can write the check_in audit record)
    const service = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (service as any).rpc('validate_and_checkin', {
      p_qr_token:       qrToken,
      p_event_id:       eventId,
      p_checked_in_by:  user.id,
    }) as { data: ScanResponse; error: { message: string } | null }

    if (error) {
      console.error('[validate] RPC error:', error.message)
      return NextResponse.json<ScanResponse>(
        { success: false, status: 'invalid' },
        { status: 500 },
      )
    }

    return NextResponse.json<ScanResponse>(data)
  } catch (err) {
    console.error('[validate] unexpected error:', err)
    return NextResponse.json<ScanResponse>(
      { success: false, status: 'invalid' },
      { status: 500 },
    )
  }
}
