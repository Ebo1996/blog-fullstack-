/**
 * Client-side polling endpoint — called by the success page to check if
 * the Chapa payment has been confirmed and tickets have been issued.
 *
 * The success page redirects back with ?tx_ref=...&order_id=...
 * It polls this endpoint until status = 'paid' or 'failed'.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/chapa'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const txRef   = searchParams.get('tx_ref')
  const orderId = searchParams.get('order_id')

  if (!txRef || !orderId) {
    return NextResponse.json({ error: 'Missing tx_ref or order_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check our DB first — fastest path when webhook already fired
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_amount, currency')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single<{ id: string; status: string; total_amount: number; currency: string }>()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Already confirmed — return immediately
  if (order.status === 'paid' || order.status === 'failed' || order.status === 'cancelled') {
    return NextResponse.json({ status: order.status })
  }

  // Still pending — actively verify with Chapa API
  try {
    const verified = await verifyPayment(txRef)
    const chapaStatus = verified.data?.status

    if (chapaStatus === 'success') {
      // Webhook may not have fired yet — trigger processing inline
      // (idempotent — the webhook handler will also run when it arrives)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (!error) {
        return NextResponse.json({ status: 'paid' })
      }
    }

    if (chapaStatus === 'failed') {
      await supabase
        .from('orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
      return NextResponse.json({ status: 'failed' })
    }

    // Still pending on Chapa's side
    return NextResponse.json({ status: 'pending' })
  } catch (err) {
    console.error('[verify] Chapa verify error:', err)
    // Return DB status as fallback — don't fail the polling
    return NextResponse.json({ status: order.status })
  }
}
