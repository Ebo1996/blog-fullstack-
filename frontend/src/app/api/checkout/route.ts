import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  stripe,
  buildLineItems,
  calculateFee,
  calculateTotal,
} from '@/lib/stripe'

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

// ─── Helper types ──────────────────────────────────────────────────────────────
interface TicketTypeRow {
  id: string
  name: string
  description: string | null
  price: number
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

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ error: 'You must be signed in to purchase tickets.' }, { status: 401 })
    }

    // ── 3. Validate event is published ────────────────────────────────────
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('id, title, slug, status')
      .eq('id', eventId)
      .eq('status', 'published')
      .single<EventRow>()

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found or not available.' }, { status: 404 })
    }

    // ── 4. Validate ticket types + inventory (server-side, not trusting client) ─
    const ticketTypeIds = items.map((i) => i.ticketTypeId)

    const { data: ticketTypes, error: ttErr } = await supabase
      .from('ticket_types')
      .select('id, name, description, price, currency, quantity, sold_quantity, status, sales_start_at, sales_end_at')
      .in('id', ticketTypeIds)
      .eq('event_id', eventId) as { data: TicketTypeRow[] | null; error: unknown }

    if (ttErr || !ticketTypes || ticketTypes.length !== ticketTypeIds.length) {
      return NextResponse.json({ error: 'One or more ticket types are invalid.' }, { status: 400 })
    }

    const now = new Date()
    const lineItems: Array<{
      ticketTypeId: string
      name: string
      description: string | null
      unitPrice: number
      quantity: number
      currency: string
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
        ticketTypeId: tt.id,
        name: tt.name,
        description: tt.description,
        unitPrice: tt.price,
        quantity: item.quantity,
        currency: tt.currency,
      })
    }

    // ── 5. Calculate amounts ──────────────────────────────────────────────
    const subtotal = lineItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const fees = calculateFee(subtotal)
    const total = calculateTotal(subtotal)
    const currency = lineItems[0]?.currency ?? 'USD'

    // ── 6. Create a pending order via service client (bypasses RLS insert check) ─
    const service = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertResult = await (service as any)
      .from('orders')
      .insert({
        user_id:      user.id,
        event_id:     eventId,
        status:       'pending',
        subtotal,
        fees,
        total_amount: total,
        currency:     currency.toUpperCase(),
      })
      .select('id')
      .single() as { data: { id: string } | null; error: { message: string } | null }

    const order    = insertResult.data
    const orderErr = insertResult.error

    if (orderErr || !order) {
      console.error('[checkout] order insert error:', orderErr)
      return NextResponse.json({ error: 'Could not create order. Please try again.' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // ── 7. Create Stripe Checkout Session ────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: buildLineItems(lineItems),
      // Platform fee as a separate line item so it's transparent
      ...(fees > 0 && {
        line_items: [
          ...buildLineItems(lineItems),
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: fees,
              product_data: { name: 'Platform fee' },
            },
            quantity: 1,
          },
        ],
      }),
      metadata: {
        order_id:  order.id,
        event_id:  eventId,
        user_id:   user.id,
        // Serialise items for webhook use — compact format
        items: JSON.stringify(
          lineItems.map((li) => ({
            t: li.ticketTypeId,
            q: li.quantity,
            p: li.unitPrice,
          })),
        ),
      },
      client_reference_id: order.id,
      customer_email:      user.email ?? undefined,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url:  `${appUrl}/checkout/cancel?order_id=${order.id}&event_slug=${event.slug}`,
      expires_at:  Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    })

    // ── 8. Store the Stripe session ID on the order ───────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url, sessionId: session.id, orderId: order.id })
  } catch (err) {
    console.error('[checkout] unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
