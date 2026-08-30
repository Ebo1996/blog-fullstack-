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
  const sp      = await searchParams
  const orderId = getString(sp['order_id'])
  const txRef   = getString(sp['tx_ref'])

  // Both params required
  if (!orderId || !txRef) redirect('/events')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch order — scoped to this user
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, currency,
      event:events(id, title, slug, start_at, venue_name, city)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single<{
      id: string
      status: string
      total_amount: number
      currency: string
      event: {
        id: string
        title: string
        slug: string
        start_at: string
        venue_name: string | null
        city: string | null
      }
    }>()

  if (!order) redirect('/dashboard/orders')

  // If already paid, fetch tickets immediately so the page renders fast
  const tickets = order.status === 'paid'
    ? await getTicketsForOrder(orderId, user.id)
    : []

  return (
    <SuccessClient
      orderId={orderId}
      txRef={txRef}
      initialStatus={order.status}
      totalAmount={order.total_amount}
      currency={order.currency}
      event={order.event}
      initialTickets={tickets}
    />
  )
}
