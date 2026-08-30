import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'

const schema = z.object({
  ticketId: z.string().uuid(),
  toEmail:  z.string().email(),
})

export async function POST(request: Request) {
  const ip = (request as unknown as { headers: Headers }).headers?.get('x-forwarded-for') ?? 'anonymous'

  return withRateLimit(
    `transfer:${ip}`,
    RATE_LIMITS.TRANSFERS,
    async () => {
  try {
    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      )
    }

    const { ticketId, toEmail } = parsed.data

    // Auth: get the calling user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const service = createServiceClient()

    // Resolve recipient email → auth user id → profile
    const { data: usersResult } = await service.auth.admin.listUsers({ perPage: 1000 })
    const recipientAuthUser = usersResult?.users.find((u) => u.email === toEmail) ?? null

    if (!recipientAuthUser) {
      return NextResponse.json(
        { success: false, error: 'No Northstar account found for that email address.' },
        { status: 404 },
      )
    }

    if (recipientAuthUser.id === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot transfer a ticket to yourself.' },
        { status: 400 },
      )
    }

    // Verify the ticket belongs to the calling user and is active
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, status, user_id')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single<{ id: string; status: string; user_id: string }>()

    if (ticketErr || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 },
      )
    }

    if (ticket.status !== 'active') {
      return NextResponse.json(
        { success: false, error: `Cannot transfer a ticket with status: ${ticket.status}.` },
        { status: 400 },
      )
    }

    // Check for an existing pending transfer on this ticket
    const { data: existing } = await supabase
      .from('ticket_transfers')
      .select('id')
      .eq('ticket_id', ticketId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This ticket already has a pending transfer. Cancel it first.' },
        { status: 409 },
      )
    }

    // Insert transfer record via service client (bypasses RLS for cross-user operation)
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (service as any)
      .from('ticket_transfers')
      .insert({
        ticket_id:    ticketId,
        from_user_id: user.id,
        to_user_id:   recipientAuthUser.id,
        status:       'pending',
        expires_at:   expiresAt,
      })

    if (insertErr) {
      console.error('[transfer] insert error:', insertErr.message)
      return NextResponse.json(
        { success: false, error: 'Transfer could not be created. Please try again.' },
        { status: 500 },
      )
    }

    // Notify the recipient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).rpc('create_notification', {
      p_user_id: recipientAuthUser.id,
      p_type:    'ticket_transfer_received',
      p_title:   'Ticket transfer received',
      p_message: 'Someone has transferred a ticket to you. You have 72 hours to accept.',
      p_data:    { ticket_id: ticketId },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[transfer] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
    },
  )
}
