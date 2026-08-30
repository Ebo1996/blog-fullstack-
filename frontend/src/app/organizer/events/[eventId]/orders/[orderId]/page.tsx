import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { RefundDialog } from '@/components/organizer/refund-dialog'
import { RefundHistory } from '@/components/organizer/refund-history'
import { OrderStatusBadge } from '@/components/ui/badge'
import { canRefundOrder, getOrderRefunds } from '@/services/refunds'
import { formatDate, formatCurrency, formatOrderId } from '@/lib/utils/format'
import { createRefundAction } from './actions'
import type { Profile } from '@/types/database'
import type { RefundActionResult } from './actions'

interface Props {
  params: Promise<{ eventId: string; orderId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return { title: `Order ${formatOrderId(orderId)}` }
}

export default async function OrderDetailPage({ params }: Props) {
  const { eventId, orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'organizer') redirect('/dashboard')

  // Get order with buyer and tickets
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!orders_user_id_fkey(full_name, avatar_url),
      event:events(id, title, slug, start_at, venue_name, city, organizer_id),
      tickets(
        id,
        ticket_code,
        status,
        checked_in_at,
        ticket_type:ticket_types(name, price, currency)
      )
    `)
    .eq('id', orderId)
    .single<{
      id: string
      user_id: string
      status: string
      subtotal: number
      fees: number
      total_amount: number
      currency: string
      created_at: string
      buyer: { full_name: string | null; avatar_url: string | null }
      event: {
        id: string
        title: string
        slug: string
        start_at: string
        venue_name: string | null
        city: string | null
        organizer_id: string
      }
      tickets: Array<{
        id: string
        ticket_code: string
        status: string
        checked_in_at: string | null
        ticket_type: { name: string; price: number; currency: string }
      }>
    }>()

  if (!order) notFound()
  if (order.event.organizer_id !== user.id) notFound()

  // Check if can refund
  const refundCheck = await canRefundOrder(orderId, user.id)

  // Get refund history
  const refunds = await getOrderRefunds(orderId)

  // Bind refund action
  const boundRefundAction = async (
    orderId: string,
    eventId: string,
    amount: number,
    reason: string,
  ): Promise<RefundActionResult> => {
    'use server'
    return createRefundAction(orderId, eventId, amount, reason)
  }

  const checkedInCount = order.tickets.filter((t) => t.status === 'used').length

  return (
    <>
      <OrganizerHeader
        title={`Order ${formatOrderId(order.id)}`}
        eyebrow={order.event.title.toUpperCase()}
        profile={profile}
      />

      <main className="content detail-content">
        <Link
          href={`/organizer/events/${eventId}/orders`}
          className="back-link"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to orders
        </Link>

        <div className="dashboard-grid">
          {/* Left column: Order details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Order info */}
            <section className="panel" aria-labelledby="order-info-heading">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">ORDER DETAILS</div>
                  <h2 id="order-info-heading">Order information</h2>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="detail-grid">
                <div>
                  <span>Order ID</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {order.id}
                  </strong>
                </div>
                <div>
                  <span>Order date</span>
                  <strong>{formatDate(order.created_at, 'MMM d, yyyy · h:mm a')}</strong>
                </div>
                <div>
                  <span>Buyer</span>
                  <strong>{order.buyer?.full_name ?? 'Unknown'}</strong>
                </div>
                <div>
                  <span>Tickets</span>
                  <strong>{order.tickets.length} ticket{order.tickets.length !== 1 ? 's' : ''}</strong>
                </div>
                <div>
                  <span>Checked in</span>
                  <strong>
                    {checkedInCount} / {order.tickets.length}
                  </strong>
                </div>
              </div>
            </section>

            {/* Event info */}
            <section className="panel" aria-labelledby="event-info-heading">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">EVENT</div>
                  <h2 id="event-info-heading">{order.event.title}</h2>
                </div>
                <Link
                  href={`/organizer/events/${order.event.id}`}
                  className="text-link"
                  style={{ fontSize: 12 }}
                >
                  View event →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted-foreground)' }}>
                  <Calendar size={14} aria-hidden="true" />
                  {formatDate(order.event.start_at, 'EEEE, MMMM d, yyyy · h:mm a')}
                </div>
                {order.event.venue_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted-foreground)' }}>
                    <MapPin size={14} aria-hidden="true" />
                    {order.event.venue_name}
                    {order.event.city && ` · ${order.event.city}`}
                  </div>
                )}
              </div>
            </section>

            {/* Tickets */}
            <section className="panel" aria-labelledby="tickets-heading">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">TICKETS</div>
                  <h2 id="tickets-heading">{order.tickets.length} ticket{order.tickets.length !== 1 ? 's' : ''}</h2>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--muted)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TicketIcon size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                      <div>
                        <strong style={{ display: 'block', fontSize: 13, marginBottom: 2 }}>
                          {ticket.ticket_type.name}
                        </strong>
                        <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          {ticket.ticket_code}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600 }}>
                        {formatCurrency(ticket.ticket_type.price, ticket.ticket_type.currency)}
                      </span>
                      <OrderStatusBadge status={ticket.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: Payment & Refunds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Payment summary */}
            <section className="panel" aria-labelledby="payment-heading">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">PAYMENT</div>
                  <h2 id="payment-heading">Order total</h2>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Fees</span>
                  <span>{formatCurrency(order.fees, order.currency)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </div>

              {/* Refund button */}
              {refundCheck.canRefund && refundCheck.maxAmount && (
                <div style={{ marginTop: 16 }}>
                  <RefundDialog
                    orderId={order.id}
                    eventId={eventId}
                    maxAmount={refundCheck.maxAmount}
                    currency={order.currency}
                    refundAction={boundRefundAction}
                  />
                </div>
              )}

              {!refundCheck.canRefund && refundCheck.reason && (
                <div
                  className="alert alert-info"
                  style={{ marginTop: 16, fontSize: 12 }}
                >
                  {refundCheck.reason}
                </div>
              )}
            </section>

            {/* Refund history */}
            {refunds.length > 0 && (
              <section className="panel" aria-labelledby="refunds-heading">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">REFUNDS</div>
                    <h2 id="refunds-heading">Refund history</h2>
                  </div>
                </div>
                <RefundHistory refunds={refunds} currency={order.currency} />
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
