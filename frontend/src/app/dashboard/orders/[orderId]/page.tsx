import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { OrderStatusBadge } from '@/components/ui/badge'
import { EventArt } from '@/components/attendee/event-art'
import { getOrderById, getUnreadNotificationCount } from '@/services/attendee'
import {
  formatDate,
  formatCurrency,
  formatOrderId,
} from '@/lib/utils/format'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

interface Props { params: Promise<{ orderId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return { title: `Order ${orderId.slice(0, 8).toUpperCase()}` }
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const [order, unreadCount] = await Promise.all([
    getOrderById(orderId, user.id),
    getUnreadNotificationCount(user.id),
  ])

  if (!order) notFound()

  const totalTickets = order.order_items.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      <DashboardHeader
        title={formatOrderId(order.id)}
        eyebrow="ORDERS / ORDER DETAIL"
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content detail-content">
        <Link href="/dashboard/orders" className="back-link">
          ← Back to orders
        </Link>

        {/* ── Order summary card ─────────────────────────────────── */}
        <div className="digital-ticket" style={{ marginTop: 24 }}>
          {/* Header */}
          <div className="digital-top" style={{ marginBottom: 24 }}>
            <div>
              <OrderStatusBadge status={order.status} />
              <h2 style={{ color: '#171713' }}>{order.event.title}</h2>
              <p>
                <CalendarDays
                  size={12}
                  style={{ display: 'inline', marginRight: 5 }}
                  aria-hidden="true"
                />
                {formatDate(order.event.start_at, 'EEE, MMM d, yyyy')}
              </p>
              <p style={{ marginTop: 4, fontSize: 11, color: '#77766f' }}>
                Placed {formatDate(order.created_at, 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
            <EventArt title={order.event.title} id={order.event.id} small />
          </div>

          {/* Line items */}
          <div
            style={{
              borderTop: '1px solid #c9c6bb',
              paddingTop: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {order.order_items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 13,
                  color: '#171713',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ticket size={13} style={{ color: '#77766f' }} aria-hidden="true" />
                  <span>
                    {item.ticket_type.name}
                    {item.quantity > 1 && (
                      <span style={{ color: '#77766f', marginLeft: 6 }}>
                        × {item.quantity}
                      </span>
                    )}
                  </span>
                </div>
                <span style={{ fontWeight: 600 }}>
                  {formatCurrency(item.subtotal, order.currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="digital-bottom" style={{ flexDirection: 'column', gap: 8, marginTop: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#77766f',
              }}
            >
              <span>Subtotal ({totalTickets} ticket{totalTickets !== 1 ? 's' : ''})</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: '#77766f',
              }}
            >
              <span>Platform fee</span>
              <span>{formatCurrency(order.fees, order.currency)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
                fontWeight: 700,
                paddingTop: 10,
                borderTop: '1px solid #c9c6bb',
                color: '#171713',
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(order.total_amount, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="detail-actions">
          <Link
            href="/dashboard/tickets"
            className="button button-dark"
            style={{ display: 'inline-flex', gap: 8 }}
          >
            <Ticket size={14} aria-hidden="true" />
            View tickets
          </Link>
          <Link
            href={`/events/${order.event.id}`}
            className="button button-outline"
            style={{ display: 'inline-flex', gap: 8 }}
          >
            <MapPin size={14} aria-hidden="true" />
            View event
          </Link>
        </div>

        {/* Refund notice */}
        {(order.status === 'refunded' || order.status === 'partially_refunded') && (
          <div className="alert alert-info" role="status" style={{ marginTop: 20 }}>
            {order.status === 'refunded'
              ? 'This order has been fully refunded. Allow 5–10 business days for the funds to appear.'
              : 'Part of this order has been refunded. Contact support if you have questions.'}
          </div>
        )}
      </main>
    </>
  )
}
