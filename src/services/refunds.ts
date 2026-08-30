/**
 * Refund service
 * Handles Chapa refunds, order status updates, and ticket cancellation
 * Creates audit trail for all refund operations
 */

import { createRefund as createChapaRefund, centsToETB } from '@/lib/chapa'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createNotification } from './notifications'
import { sendRefundNotification } from '@/lib/email'

export interface RefundResult {
  success: boolean
  refundId?: string
  error?: string
}

export interface RefundDetails {
  id: string
  order_id: string
  amount: number
  currency: string
  reason: string | null
  status: 'pending' | 'succeeded' | 'failed'
  payment_refund_id: string | null
  created_at: string
  created_by: string
}

// ─── CREATE REFUND ────────────────────────────────────────────────────────────

export async function createRefund(
  orderId: string,
  amount: number,
  reason: string,
  organizerId: string,
): Promise<RefundResult> {
  const supabase = await createClient()
  const service = createServiceClient()

  // 1. Get order details
  const { data: order } = await service
    .from('orders')
    .select(`
      id,
      user_id,
      event_id,
      payment_tx_ref,
      payment_reference,
      total_amount,
      currency,
      status,
      event:events(id, title, organizer_id)
    `)
    .eq('id', orderId)
    .single<{
      id: string
      user_id: string
      event_id: string
      payment_tx_ref: string | null
      payment_reference: string | null
      total_amount: number
      currency: string
      status: string
      event: { id: string; title: string; organizer_id: string }
    }>()

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  // 2. Verify organizer owns this event
  if (order.event.organizer_id !== organizerId) {
    return { success: false, error: 'Not authorized' }
  }

  // 3. Verify order is paid
  if (order.status !== 'paid') {
    return { success: false, error: `Cannot refund ${order.status} order` }
  }

  // 4. Verify refund amount
  if (amount <= 0 || amount > order.total_amount) {
    return { success: false, error: 'Invalid refund amount' }
  }

  // 5. Verify we have a tx_ref (stored in payment_tx_ref)
  const txRef = order.payment_tx_ref
  if (!txRef) {
    return { success: false, error: 'No payment reference found for this order' }
  }

  // 6. Create Chapa refund (amount must be in ETB, not cents)
  const amountETB = centsToETB(amount)
  let chapaRefund
  try {
    chapaRefund = await createChapaRefund({
      tx_ref: txRef,
      amount: amountETB,
      reason: reason.slice(0, 500),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Chapa refund failed'
    console.error('[refunds] Chapa refund error:', msg)
    return { success: false, error: msg }
  }

  if (chapaRefund.status === 'failed' || !chapaRefund.data) {
    return { success: false, error: 'Chapa refund failed' }
  }

  // 7. Determine if full or partial refund
  const isFullRefund = amount >= order.total_amount
  const newStatus = isFullRefund ? 'refunded' : 'partially_refunded'

  // 8. Update order status
  const { error: updateError } = await service
    .from('orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('[refunds] Order update error:', updateError)
    return { success: false, error: 'Could not update order status' }
  }

  // 9. Cancel tickets if full refund
  if (isFullRefund) {
    await service
      .from('tickets')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('status', 'active')
  }

  // 10. Create refund record (audit trail)
  const { data: refundRecord, error: refundError } = await service
    .from('refunds')
    .insert({
      order_id: orderId,
      amount,
      currency: order.currency,
      reason,
      status: chapaRefund.data.status === 'success' ? 'succeeded' : 'pending',
      payment_refund_id: chapaRefund.data.id,
      created_by: organizerId,
    })
    .select('id')
    .single<{ id: string }>()

  if (refundError) {
    console.error('[refunds] Refund record error:', refundError)
  }

  // 11. Notify customer
  await createNotification(
    order.user_id,
    'payment_completed', // Could create a specific refund type
    isFullRefund ? 'Refund processed' : 'Partial refund processed',
    `${isFullRefund ? 'Full refund' : `Refund of ${formatAmount(amount, order.currency)}`} for ${order.event.title} has been initiated. It may take 5-10 business days to appear in your account.`,
    { order_id: orderId, refund_id: refundRecord?.id },
  )

  // 12. Send refund email
  const { data: userAuth } = await service.auth.admin.getUserById(order.user_id)
  if (userAuth?.user?.email) {
    await sendRefundNotification(userAuth.user.email, {
      customerName: (await service.from('profiles').select('full_name').eq('id', order.user_id).single<{ full_name: string | null }>()).data?.full_name ?? 'there',
      eventTitle: order.event.title,
      orderNumber: orderId.substring(0, 8).toUpperCase(),
      refundAmount: formatAmount(amount, order.currency),
      reason,
    })
  }

  console.log(
    `[refunds] Refund created: order=${orderId} amount=${amountETB} ETB status=${chapaRefund.data.status} chapa_id=${chapaRefund.data.id}`,
  )

  return {
    success: true,
    refundId: refundRecord?.id ?? chapaRefund.data.id,
  }
}

// ─── GET ORDER REFUNDS ────────────────────────────────────────────────────────

export async function getOrderRefunds(orderId: string): Promise<RefundDetails[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('refunds')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  return (data ?? []) as RefundDetails[]
}

// ─── GET ORGANIZER REFUNDS ────────────────────────────────────────────────────

export async function getOrganizerRefunds(
  organizerId: string,
  eventId?: string,
): Promise<Array<RefundDetails & { order: { id: string; user_id: string }; event: { title: string } }>> {
  const service = createServiceClient()

  let query = service
    .from('refunds')
    .select(`
      *,
      order:orders(id, user_id, event_id),
      event:orders(event:events(title))
    `)
    .order('created_at', { ascending: false })

  // Filter by event if specified
  if (eventId) {
    const { data } = await query
    const filtered = ((data ?? []) as unknown[]).filter((r: never) => {
      const refund = r as RefundDetails & { order: { event_id: string } }
      return refund.order?.event_id === eventId
    })
    return filtered as never
  }

  // Otherwise get all refunds for organizer's events
  const { data: events } = await service
    .from('events')
    .select('id')
    .eq('organizer_id', organizerId)

  if (!events || events.length === 0) return []

  const eventIds = events.map((e) => e.id)
  const { data } = await query

  const filtered = ((data ?? []) as unknown[]).filter((r: never) => {
    const refund = r as RefundDetails & { order: { event_id: string } }
    return refund.order?.event_id && eventIds.includes(refund.order.event_id)
  })

  return filtered as never
}

// ─── CHECK IF ORDER CAN BE REFUNDED ───────────────────────────────────────────

export async function canRefundOrder(
  orderId: string,
  organizerId: string,
): Promise<{ canRefund: boolean; reason?: string; maxAmount?: number }> {
  const service = createServiceClient()

  const { data: order } = await service
    .from('orders')
    .select(`
      id,
      status,
      total_amount,
      currency,
      event:events(organizer_id, start_at)
    `)
    .eq('id', orderId)
    .single<{
      id: string
      status: string
      total_amount: number
      currency: string
      event: { organizer_id: string; start_at: string }
    }>()

  if (!order) {
    return { canRefund: false, reason: 'Order not found' }
  }

  if (order.event.organizer_id !== organizerId) {
    return { canRefund: false, reason: 'Not authorized' }
  }

  if (order.status === 'refunded') {
    return { canRefund: false, reason: 'Already fully refunded' }
  }

  if (order.status !== 'paid' && order.status !== 'partially_refunded') {
    return { canRefund: false, reason: `Cannot refund ${order.status} order` }
  }

  // Calculate remaining refundable amount
  const { data: existingRefunds } = await service
    .from('refunds')
    .select('amount')
    .eq('order_id', orderId)
    .in('status', ['succeeded', 'pending'])

  const totalRefunded = (existingRefunds ?? []).reduce(
    (sum, r) => sum + ((r as { amount: number }).amount ?? 0),
    0,
  )

  const maxAmount = order.total_amount - totalRefunded

  if (maxAmount <= 0) {
    return { canRefund: false, reason: 'Already fully refunded' }
  }

  return { canRefund: true, maxAmount }
}

// ─── Helper: format amount ────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}
