/**
 * TEST ONLY: Manual payment verification
 * 
 * In development, Chapa can't reach localhost webhooks.
 * Use this endpoint to manually verify a test payment.
 * 
 * Usage: POST http://localhost:3000/api/test-verify-payment
 * Body: { "tx_ref": "order_abc123_xyz789" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPayment } from '@/lib/chapa'

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  let body: { tx_ref?: string } = {}
  
  try {
    body = await req.json() as { tx_ref?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const txRef = body.tx_ref
  if (!txRef) {
    return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 })
  }

  // Verify with Chapa
  let verified
  try {
    verified = await verifyPayment(txRef)
    console.log('[test-verify] Chapa response:', JSON.stringify(verified, null, 2))
  } catch (err) {
    console.error('[test-verify] Verification failed:', err)
    return NextResponse.json({ error: 'Verification failed', details: String(err) }, { status: 502 })
  }

  if (verified.status !== 'success' || verified.data?.status !== 'success') {
    return NextResponse.json({ 
      error: 'Payment not successful', 
      status: verified.data?.status,
      data: verified.data 
    }, { status: 400 })
  }

  // Look up order
  const service = createServiceClient()

  const { data: order, error: orderErr } = await service
    .from('orders')
    .select('id, user_id, event_id, status, total_amount')
    .eq('payment_tx_ref', txRef)
    .single<{
      id: string
      user_id: string
      event_id: string
      status: string
      total_amount: number
    }>()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found', txRef }, { status: 404 })
  }

  if (order.status === 'paid') {
    return NextResponse.json({ message: 'Already processed', order })
  }

  // Get order items
  const { data: orderItems } = await service
    .from('order_items')
    .select('ticket_type_id, quantity')
    .eq('order_id', order.id) as {
      data: Array<{ ticket_type_id: string; quantity: number }> | null
    }

  if (!orderItems || orderItems.length === 0) {
    return NextResponse.json({ error: 'No order items found' }, { status: 400 })
  }

  // Create tickets
  const ticketInserts: Array<{
    order_id: string
    event_id: string
    ticket_type_id: string
    user_id: string
    ticket_code: string
    qr_token: string
    status: string
  }> = []

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

  // Mark order paid + create tickets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (service as any)
    .from('orders')
    .update({
      status:     'paid',
      updated_at: new Date().toISOString(),
      payment_reference: verified.data.reference,
    })
    .eq('id', order.id)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update order', details: updateErr }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: ticketErr } = await (service as any)
    .from('tickets')
    .insert(ticketInserts)

  if (ticketErr) {
    return NextResponse.json({ error: 'Failed to create tickets', details: ticketErr }, { status: 500 })
  }

  // Update sold quantities
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

  // Create notifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).from('notifications').insert([
    {
      user_id: order.user_id,
      type:    'payment_completed',
      title:   'Payment successful',
      message: `Your payment has been confirmed.`,
      data:    { order_id: order.id, tx_ref: txRef },
    },
    {
      user_id: order.user_id,
      type:    'ticket_purchased',
      title:   'Tickets confirmed',
      message: `${ticketInserts.length} ticket(s) issued.`,
      data:    { order_id: order.id },
    },
  ])

  return NextResponse.json({ 
    success: true, 
    order, 
    ticketsCreated: ticketInserts.length,
    message: 'Payment verified and tickets created!' 
  })
}

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
