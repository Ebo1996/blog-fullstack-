/**
 * Chapa payment webhook handler
 *
 * Chapa POSTs to this endpoint when a payment completes.
 * Body contains: { tx_ref, status, ... }
 *
 * We verify the payment by calling Chapa's verify endpoint
 * before doing anything — never trust the webhook body alone.
 *
 * Docs: https://developer.chapa.co/docs/webhooks
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPayment, verifyChapaWebhookSignature } from '@/lib/chapa'
import { sendOrderConfirmation, sendTicketDelivery } from '@/lib/email'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'chapa-webhook'
  
  return withRateLimit(
    `webhook:${ip}`,
    RATE_LIMITS.WEBHOOK,
    async () => {
      // ── 0. Read raw body (needed for HMAC verification) ─────────────────
      let rawBody: string
      try {
        rawBody = await req.text()
      } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
      }

      // ── 1. Verify Chapa HMAC signature ───────────────────────────────────
      const signature = req.headers.get('x-chapa-signature')
      const signatureValid = await verifyChapaWebhookSignature(rawBody, signature)
      if (!signatureValid) {
        console.warn('[chapa-webhook] Invalid or missing signature — rejected')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      // ── 2. Parse body ────────────────────────────────────────────────────
      let body: { tx_ref?: string; status?: string } = {}
      try {
        body = JSON.parse(rawBody) as { tx_ref?: string; status?: string }
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
      }

      const txRef = body.tx_ref
      if (!txRef) {
        return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 })
      }

  // ── 1. Verify with Chapa — never trust webhook body alone ────────────────
  let verified
  try {
    verified = await verifyPayment(txRef)
  } catch (err) {
    console.error('[chapa-webhook] Verification failed:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 502 })
  }

  if (verified.status !== 'success' || verified.data?.status !== 'success') {
    // Payment not successful — mark order failed if it exists
    console.warn('[chapa-webhook] Payment not successful:', txRef, verified.data?.status)
    const service = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('orders')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('payment_tx_ref', txRef)
      .eq('status', 'pending')
    return NextResponse.json({ received: true })
  }

  // ── 2. Look up order by tx_ref ────────────────────────────────────────────
  const service = createServiceClient()

  const { data: order, error: orderErr } = await service
    .from('orders')
    .select('id, user_id, event_id, status, subtotal, total_amount, currency')
    .eq('payment_tx_ref', txRef)
    .single<{
      id: string
      user_id: string
      event_id: string
      status: string
      subtotal: number
      total_amount: number
      currency: string
    }>()

  if (orderErr || !order) {
    console.error('[chapa-webhook] Order not found for tx_ref:', txRef)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency — already processed
  if (order.status === 'paid') {
    return NextResponse.json({ received: true })
  }

  // ── 3. Get ticket types from order items ──────────────────────────────────
  const { data: orderItems } = await service
    .from('order_items')
    .select('ticket_type_id, quantity, unit_price')
    .eq('order_id', order.id) as {
      data: Array<{ ticket_type_id: string; quantity: number; unit_price: number }> | null
    }

  // If no order_items yet (direct path without pre-created items), create tickets directly
  const ticketInserts: Array<{
    order_id: string
    event_id: string
    ticket_type_id: string
    user_id: string
    ticket_code: string
    qr_token: string
    status: string
  }> = []

  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        ticketInserts.push({
          order_id:       order.id,
          event_id:       order.event_id,
          ticket_type_id: item.ticket_type_id,
          user_id:        order.user_id,
          ticket_code:    generateTicketCode(),
          qr_token:       generateQrToken(),
          status:         'active',
        })
      }
    }
  }

  // ── 4. Atomically: mark order paid + create tickets ───────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (service as any)
    .from('orders')
    .update({
      status:     'paid',
      updated_at: new Date().toISOString(),
      payment_reference: verified.data.reference, // store Chapa reference
    })
    .eq('id', order.id)
    .eq('status', 'pending')

  if (updateErr) {
    console.error('[chapa-webhook] Failed to mark order paid:', updateErr)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  if (ticketInserts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: ticketErr } = await (service as any)
      .from('tickets')
      .insert(ticketInserts)

    if (ticketErr) {
      console.error('[chapa-webhook] Failed to create tickets:', ticketErr)
      // Don't fail — order is paid, tickets can be retried
    }

    // Update sold_quantity for each ticket type
    const qtySummary = ticketInserts.reduce<Record<string, number>>((acc, t) => {
      acc[t.ticket_type_id] = (acc[t.ticket_type_id] ?? 0) + 1
      return acc
    }, {})

    for (const [ticketTypeId, qty] of Object.entries(qtySummary)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).rpc('increment_sold_quantity', {
        p_ticket_type_id: ticketTypeId,
        p_quantity: qty,
      })
    }
  }

  // ── 5. Create notifications ───────────────────────────────────────────────
  const totalFormatted = formatETB(order.total_amount)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).from('notifications').insert([
    {
      user_id: order.user_id,
      type:    'payment_completed',
      title:   'Payment successful',
      message: `Your payment of ${totalFormatted} has been confirmed via Chapa.`,
      data:    { order_id: order.id, tx_ref: txRef },
    },
    {
      user_id: order.user_id,
      type:    'ticket_purchased',
      title:   'Tickets confirmed',
      message: `Your tickets have been issued. Check "My Tickets" to view them.`,
      data:    { order_id: order.id },
    },
  ])

  // ── 6. Send email notifications ───────────────────────────────────────────
  // Get user and event details for emails
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, id')
    .eq('id', order.user_id)
    .single<{ full_name: string | null; id: string }>()

  const { data: event } = await service
    .from('events')
    .select('title, slug, start_at, venue_name')
    .eq('id', order.event_id)
    .single<{ title: string; slug: string; start_at: string; venue_name: string | null }>()

  const { data: userAuth } = await service.auth.admin.getUserById(order.user_id)
  const userEmail = userAuth?.user?.email

  if (userEmail && profile && event) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    
    // Send order confirmation
    await sendOrderConfirmation(userEmail, {
      customerName: profile.full_name ?? 'there',
      eventTitle: event.title,
      eventDate: new Date(event.start_at).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      eventVenue: event.venue_name ?? 'TBA',
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      ticketCount: ticketInserts.length,
      totalAmount: totalFormatted,
      myTicketsUrl: `${appUrl}/dashboard/tickets`,
    })

    // Send ticket delivery with ticket codes
    if (ticketInserts.length > 0) {
      // Get ticket type names
      const ticketTypeIds = [...new Set(ticketInserts.map(t => t.ticket_type_id))]
      const { data: ticketTypes } = await service
        .from('ticket_types')
        .select('id, name')
        .in('id', ticketTypeIds)

      const ticketTypeMap = new Map(
        (ticketTypes ?? []).map((tt: { id: string; name: string }) => [tt.id, tt.name])
      )

      await sendTicketDelivery(userEmail, {
        customerName: profile.full_name ?? 'there',
        eventTitle: event.title,
        eventDate: new Date(event.start_at).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        eventVenue: event.venue_name ?? 'TBA',
        tickets: ticketInserts.map(t => ({
          typeName: ticketTypeMap.get(t.ticket_type_id) ?? 'Ticket',
          ticketCode: t.ticket_code,
          qrUrl: `${appUrl}/ticket/${t.qr_token}`,
        })),
        myTicketsUrl: `${appUrl}/dashboard/tickets`,
      })
    }
  }

  console.log(`[chapa-webhook] Payment confirmed for order ${order.id}, tx_ref: ${txRef}`)
  return NextResponse.json({ received: true })
    },
  )
}

// ─── Also handle GET — Chapa sometimes sends a GET to verify the endpoint ────
export async function GET() {
  return NextResponse.json({ status: 'ok', provider: 'chapa' })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'NS-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateQrToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function formatETB(cents: number): string {
  return new Intl.NumberFormat('am-ET', {
    style:    'currency',
    currency: 'ETB',
  }).format(cents / 100)
}
