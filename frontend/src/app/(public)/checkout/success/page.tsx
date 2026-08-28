import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTicketsForOrder } from '@/services/payments'
import { SuccessClient } from './success-client'

export const metadata: Metadata = { title: 'Order confirmed' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getString(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams
  const orderId   = getString(sp['order_id'])
  const sessionId = getString(sp['session_id'])

  // Both params required — redirect away if missing
  if (!orderId || !sessionId) redirect('/events')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server-render initial data: current order status + tickets (if already paid)
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_amount, currency, event:events(id, title, slug, start_at, venue_name, city)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single<{
      id: string
      status: string
      total_amount: number
      currency: string
      event: { id: string; title: string; slug: string; start_at: string; venue_name: string | null; city: string | null }
    }>()

  // Prevent accessing another user's order
  if (!order) redirect('/dashboard/orders')

  // If already paid (webhook fired before page load) — fetch tickets immediately
  const tickets = order.status === 'paid'
    ? await getTicketsForOrder(orderId, user.id)
    : []

  return (
    <SuccessClient
      orderId={orderId}
      initialStatus={order.status}
      totalAmount={order.total_amount}
      currency={order.currency}
      event={order.event}
      initialTickets={tickets}
    />
  )
}
