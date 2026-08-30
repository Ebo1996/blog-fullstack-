import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rsvpToEvent } from '@/services/payments'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'

const schema = z.object({
  eventId: z.string().uuid(),
})

export async function POST(request: Request) {
  const ip = (request as unknown as { headers: Headers }).headers?.get('x-forwarded-for') ?? 'anonymous'

  return withRateLimit(
    `rsvp:${ip}`,
    RATE_LIMITS.API_DEFAULT,
    async () => {
  try {
    const body   = await request.json() as unknown
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'You must be signed in to RSVP.' },
        { status: 401 },
      )
    }

    const result = await rsvpToEvent(parsed.data.eventId, user.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, status: result.status })
  } catch (err) {
    console.error('[rsvp] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
    },
  )
}
