import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, CreditCard, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { OrderStatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { getMyOrders, getUnreadNotificationCount } from '@/services/attendee'
import { formatDate, formatCurrency, formatOrderId } from '@/lib/utils/format'
import { EventArt } from '@/components/attendee/event-art'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orders' }

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const [orders, unreadCount] = await Promise.all([
    getMyOrders(user.id),
    getUnreadNotificationCount(user.id),
  ])

  return (
    <>
      <DashboardHeader
        title="Orders"
        eyebrow="YOUR PURCHASES"
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content">
        <div className="page-intro">
          <p>A record of your ticket purchases and receipts.</p>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} />}
            title="No orders yet"
            description="When you purchase tickets, your order history will appear here."
            action={{ label: 'Browse events', href: '/events' }}
          />
        ) : (
          <section className="panel list-panel" aria-label="Order history">
            {orders.map((order) => {
              const ticketCount = order.order_items.reduce(
                (s, i) => s + i.quantity, 0,
              )
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="order-row"
                  aria-label={`Order ${formatOrderId(order.id)} — ${order.event.title}`}
                >
                  {/* Icon */}
                  <div className="order-icon" aria-hidden="true">
                    <CreditCard size={15} />
                  </div>

                  {/* Event art + info */}
                  <EventArt
                    title={order.event.title}
                    id={order.event.id}
                    small
                  />

                  <div className="event-copy" style={{ flex: 1, minWidth: 0 }}>
                    <strong>{formatOrderId(order.id)}</strong>
                    <span>
                      {order.event.title} ·{' '}
                      {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
                    </span>
                    <span style={{ marginTop: 2 }}>
                      {formatDate(order.created_at, 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>
                      {formatCurrency(order.total_amount, order.currency)}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <ChevronRight
                    size={16}
                    style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                </Link>
              )
            })}
          </section>
        )}
      </main>
    </>
  )
}
