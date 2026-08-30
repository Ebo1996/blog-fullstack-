import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  chapaEnabled,
  initializePayment,
  calculateFee,
  calculateTotal,
  centsToETB,
  buildTxRef,
} from '@/lib/chapa'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'

// ─── Request schema ───────────────────────────────────────────────────────────
const checkoutSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().int().positive().max(20),
      }),
    )
    .min(1, 'Select at least one ticket')
    .max(10),
})

// ─── Helper types ─────────────────────────────────────────────────────────────
interface TicketTypeRow {
  id: string
  name: string
  description: string | null
  price: number       // stored in agelot (cents), e.g. 15000 = 150 ETB
  currency: string
  quantity: number
  sold_quantity: number
  status: string
  sales_start_at: string | null
  sales_end_at: string | null
}

interface EventRow {
  id: string
  title: string
  slug: string
  status: string
}

export async function POST(request: NextRequest) {
  // Get user IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'anonymous'
  
  return withRateLimit(
    `checkout:${ip}`,
    RATE_LIMITS.CHECKOUT,
    async () => {
      try {
        // ── 0. Guard: Chapa not configured ────────────────────────────────────
        if (!chapaEnabled) {
          return NextResponse.json(
            {
              error:    'Payments are not configured yet.',
              provider: 'chapa',
              hint:     'Add CHAPA_SECRET_KEY to .env.local. Get your key at dashboard.chapa.co',
            },
            { status: 503 },
          )
        }

        // ── 1. Parse + validate body ──────────────────────────────────────────
        const body = await request.json() as unknown
        const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 },
      )
    }
    const { eventId, items } = parsed.data

    // ── 2. Authenticate ───────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to purchase tickets.' },
        { status: 401 },
      )
    }

    // ── 3. Get user profile (need name for Chapa) ─────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single<{ full_name: string | null }>()

    const nameParts  = (profile?.full_name ?? 'Northstar User').split(' ')
    const firstName  = nameParts[0] ?? 'Northstar'
    const lastName   = nameParts.slice(1).join(' ') || 'User'

    // ── 4. Validate event is published ────────────────────────────────────
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('id, title, slug, status')
      .eq('id', eventId)
      .eq('status', 'published')
      .single<EventRow>()

    if (eventErr || !event) {
      return NextResponse.json(
        { error: 'Event not found or not available.' },
        { status: 404 },
      )
    }

    // ── 5. Validate ticket types + inventory ──────────────────────────────
    const ticketTypeIds = items.map((i) => i.ticketTypeId)

    const { data: ticketTypes, error: ttErr } = await supabase
      .from('ticket_types')
      .select('id, name, description, price, currency, quantity, sold_quantity, status, sales_start_at, sales_end_at')
      .in('id', ticketTypeIds)
      .eq('event_id', eventId) as { data: TicketTypeRow[] | null; error: unknown }

    if (ttErr || !ticketTypes || ticketTypes.length !== ticketTypeIds.length) {
      return NextResponse.json(
        { error: 'One or more ticket types are invalid.' },
        { status: 400 },
      )
    }

    const now = new Date()
    const lineItems: Array<{
      ticketTypeId: string
      name: string
      unitPriceCents: number
      quantity: number
    }> = []

    for (const item of items) {
      const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)
      if (!tt) {
        return NextResponse.json({ error: 'Ticket type not found.' }, { status: 400 })
      }
      if (tt.status === 'inactive') {
        return NextResponse.json({ error: `"${tt.name}" is not currently available.` }, { status: 400 })
      }
      if (tt.status === 'sold_out' || tt.sold_quantity + item.quantity > tt.quantity) {
        return NextResponse.json({ error: `Not enough tickets available for "${tt.name}".` }, { status: 400 })
      }
      if (tt.sales_start_at && new Date(tt.sales_start_at) > now) {
        return NextResponse.json({ error: `Sales for "${tt.name}" haven't started yet.` }, { status: 400 })
      }
      if (tt.sales_end_at && new Date(tt.sales_end_at) < now) {
        return NextResponse.json({ error: `Sales for "${tt.name}" have ended.` }, { status: 400 })
      }
      lineItems.push({
        ticketTypeId:   tt.id,
        name:           tt.name,
        unitPriceCents: tt.price,
        quantity:       item.quantity,
      })
    }

    // ── 6. Calculate amounts (in ETB) ─────────────────────────────────────
    const subtotalCents = lineItems.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0)
    const subtotalETB   = centsToETB(subtotalCents)
    const feesETB       = calculateFee(subtotalETB)
    const totalETB      = calculateTotal(subtotalETB)

    // Keep DB values in cents for consistency
    const feesCents  = Math.round(feesETB  * 100)
    const totalCents = Math.round(totalETB * 100)

    // ── 7. Create pending order in DB ─────────────────────────────────────
    const service = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertResult = await (service as any)
      .from('orders')
      .insert({
        user_id:      user.id,
        event_id:     eventId,
        status:       'pending',
        subtotal:     subtotalCents,
        fees:         feesCents,
        total_amount: totalCents,
        currency:     'ETB',
      })
      .select('id')
      .single() as { data: { id: string } | null; error: { message: string } | null }

    if (insertResult.error || !insertResult.data) {
      console.error('[checkout] order insert error:', insertResult.error)
      return NextResponse.json(
        { error: 'Could not create order. Please try again.' },
        { status: 500 },
      )
    }

    const orderId = insertResult.data.id
    const txRef   = buildTxRef(orderId)

    // Store the tx_ref on the order so the webhook can look it up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('orders')
      .update({ payment_tx_ref: txRef })
      .eq('id', orderId)

    // ── 8. Initialize Chapa payment ───────────────────────────────────────
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/webhooks/chapa`
    const returnUrl   = `${appUrl}/checkout/success?tx_ref=${txRef}&order_id=${orderId}`

    // Chapa validation: very strict - use simple generic title
    const chapaResponse = await initializePayment({
      amount:      totalETB,
      currency:    'ETB',
      email:       user.email ?? `user-${user.id}@northstar.app`,
      first_name:  firstName,
      last_name:   lastName,
      tx_ref:      txRef,
      callback_url: callbackUrl,
      return_url:  returnUrl,
      customization: {
        title:       'Event Tickets',
        description: `Order ${orderId.substring(0, 8)}`,
      },
    })

    if (chapaResponse.status !== 'success' || !chapaResponse.data?.checkout_url) {
      console.error('[checkout] Chapa initialize failed:', chapaResponse)
      // Cleanup the pending order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).from('orders').update({ status: 'cancelled' }).eq('id', orderId)
      return NextResponse.json(
        { error: 'Could not start payment. Please try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      url:      chapaResponse.data.checkout_url,
      txRef,
      orderId,
    })

  } catch (err) {
    console.error('[checkout] unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
    },
  )
}
