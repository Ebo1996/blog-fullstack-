import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Stripe requires the raw body for signature verification ─────────────────
export const config = { api: { bodyParser: false } }

// Disable Next.js body parsing — we need the raw buffer
export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderRow {
  id: string
  user_id: string
  event_id: string
  status: string
  subtotal: number
  currency: string
}

interface ItemMeta {
  t: string  // ticket_type_id
  q: number  // quantity
  p: number  // unit_price
}

// ─── Main webhook handler ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // ── Signature verification — reject tampered payloads ────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  const service = createServiceClient()

  // ── Idempotency: check if this event has already been processed ───────────
  // We use a simple processed_webhook_events approach via Supabase.
  // If the event ID is already in the DB, return 200 immediately (safe retry).
  const { data: existing } = await service
    .from('processed_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle<{ id: string }>()

  if (existing) {
    console.log('[webhook] duplicate event, skipping:', event.id)
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, service)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, service)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge, service)
        break

      default:
        // Ignore unhandled event types — return 200 so Stripe stops retrying
        break
    }

    // ── Mark event as processed (idempotency record) ──────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('processed_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type:      event.type,
        processed_at:    new Date().toISOString(),
      })

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[webhook] handler error for ${event.type}:`, msg)
    // Return 500 so Stripe retries — but only for transient errors
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: checkout.session.completed
// This is the source of truth for a successful payment.
// The frontend success page NEVER determines payment status.
// ─────────────────────────────────────────────────────────────────────────────
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  service: ReturnType<typeof createServiceClient>,
) {
  const orderId   = session.metadata?.order_id
  const userId    = session.metadata?.user_id
  const itemsMeta = session.metadata?.items

  if (!orderId || !userId || !itemsMeta) {
    console.error('[webhook] checkout.session.completed missing metadata', session.id)
    return
  }

  // Fetch the order — verify it's still pending (idempotency guard)
  const { data: order, error: orderErr } = await service
    .from('orders')
    .select('id, user_id, event_id, status, subtotal, currency')
    .eq('id', orderId)
    .single<OrderRow>()

  if (orderErr || !order) {
    console.error('[webhook] order not found:', orderId)
    return
  }

  if (order.status !== 'pending') {
    console.log('[webhook] order already processed, status:', order.status, 'order:', orderId)
    return
  }

  // Parse the compact items from metadata
  let items: ItemMeta[]
  try {
    items = JSON.parse(itemsMeta) as ItemMeta[]
  } catch {
    console.error('[webhook] could not parse items metadata for order:', orderId)
    return
  }

  // ── Atomically: update order → paid, decrement inventory, create tickets ──
  // All happens inside the purchase_tickets() PostgreSQL RPC which uses
  // FOR UPDATE row locks to prevent concurrent oversell.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcResult, error: rpcErr } = await (service as any).rpc('purchase_tickets', {
    p_order_id: orderId,
    p_items: items.map((i) => ({
      ticket_type_id: i.t,
      quantity:       i.q,
      unit_price:     i.p,
    })),
  })

  if (rpcErr) {
    console.error('[webhook] purchase_tickets RPC error:', rpcErr.message, 'order:', orderId)
    // Mark order as failed so user can retry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('orders')
      .update({
        status:                     'failed',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:   session.payment_intent as string | null,
        updated_at:                 new Date().toISOString(),
      })
      .eq('id', orderId)
    return
  }

  const result = rpcResult as { success: boolean; error?: string }
  if (!result?.success) {
    console.error('[webhook] purchase_tickets returned failure:', result?.error, 'order:', orderId)
    return
  }

  // ── Update order status to paid ───────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from('orders')
    .update({
      status:                     'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:   session.payment_intent as string | null,
      updated_at:                 new Date().toISOString(),
    })
    .eq('id', orderId)

  // ── Fetch newly created tickets for the notification ─────────────────────
  const { data: tickets } = await service
    .from('tickets')
    .select('id')
    .eq('order_id', orderId)
    .eq('user_id', userId) as { data: Array<{ id: string }> | null }

  const ticketCount = tickets?.length ?? items.reduce((s, i) => s + i.q, 0)

  // ── Fetch event title for notification ────────────────────────────────────
  const { data: eventRow } = await service
    .from('events')
    .select('title')
    .eq('id', order.event_id)
    .single<{ title: string }>()

  const eventTitle = eventRow?.title ?? 'your event'

  // ── Create notifications ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).rpc('create_notification', {
    p_user_id: userId,
    p_type:    'payment_completed',
    p_title:   'Payment confirmed',
    p_message: `Your payment for ${eventTitle} was successful.`,
    p_data:    { order_id: orderId },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).rpc('create_notification', {
    p_user_id: userId,
    p_type:    'ticket_purchased',
    p_title:   `${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} confirmed`,
    p_message: `Your ticket${ticketCount !== 1 ? 's are' : ' is'} ready for ${eventTitle}. Scan your QR code at the door.`,
    p_data:    { order_id: orderId, event_id: order.event_id },
  })

  console.log(
    `[webhook] checkout.session.completed ✓ order=${orderId} tickets=${ticketCount} user=${userId}`,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: payment_intent.payment_failed
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentFailed(
  intent: Stripe.PaymentIntent,
  service: ReturnType<typeof createServiceClient>,
) {
  // Find the order by payment intent ID
  const { data: order } = await service
    .from('orders')
    .select('id, user_id, event_id, status')
    .eq('stripe_payment_intent_id', intent.id)
    .maybeSingle<{ id: string; user_id: string; event_id: string; status: string }>()

  if (!order || order.status !== 'pending') return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from('orders')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', order.id)

  const { data: eventRow } = await service
    .from('events')
    .select('title')
    .eq('id', order.event_id)
    .single<{ title: string }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).rpc('create_notification', {
    p_user_id: order.user_id,
    p_type:    'payment_failed',
    p_title:   'Payment failed',
    p_message: `Your payment for ${eventRow?.title ?? 'the event'} could not be processed. No charge was made.`,
    p_data:    { order_id: order.id },
  })

  console.log(`[webhook] payment_intent.payment_failed order=${order.id}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: charge.refunded
// ─────────────────────────────────────────────────────────────────────────────
async function handleChargeRefunded(
  charge: Stripe.Charge,
  service: ReturnType<typeof createServiceClient>,
) {
  const paymentIntentId = charge.payment_intent as string | null
  if (!paymentIntentId) return

  const { data: order } = await service
    .from('orders')
    .select('id, user_id, event_id, total_amount, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle<{ id: string; user_id: string; event_id: string; total_amount: number; status: string }>()

  if (!order || order.status === 'refunded') return

  const refundedAmount  = charge.amount_refunded
  const isFullRefund    = refundedAmount >= order.total_amount
  const newStatus       = isFullRefund ? 'refunded' : 'partially_refunded'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', order.id)

  // Cancel associated tickets on full refund
  if (isFullRefund) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('tickets')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('order_id', order.id)
      .eq('status', 'active')
  }

  const { data: eventRow } = await service
    .from('events')
    .select('title')
    .eq('id', order.event_id)
    .single<{ title: string }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).rpc('create_notification', {
    p_user_id: order.user_id,
    p_type:    'payment_completed',
    p_title:   isFullRefund ? 'Refund processed' : 'Partial refund processed',
    p_message: isFullRefund
      ? `Your full refund for ${eventRow?.title ?? 'the event'} has been processed. Allow 5–10 business days.`
      : `A partial refund for ${eventRow?.title ?? 'the event'} has been issued. Allow 5–10 business days.`,
    p_data: { order_id: order.id },
  })

  console.log(`[webhook] charge.refunded order=${order.id} status=${newStatus}`)
}
