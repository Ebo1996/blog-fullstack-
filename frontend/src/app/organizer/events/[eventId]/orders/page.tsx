import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { OrderStatusBadge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { getOrganizerEventById, getEventOrders } from '@/services/organizer'
import { formatDate, formatCurrency, formatOrderId } from '@/lib/utils/format'
import { ShoppingBag } from 'lucide-react'
import type { Profile } from '@/types/database'
import type { Metadata as NextMetadata } from 'next'

export const metadata: NextMetadata = { title: 'Orders' }

interface Props {
  params: Promise<{ eventId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EventOrdersPage({ params, searchParams }: Props) {
  const { eventId } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt((Array.isArray(sp['page']) ? sp['page'][0] : sp['page']) ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const [event, result] = await Promise.all([
    getOrganizerEventById(eventId, user.id),
    getEventOrders(eventId, user.id, page),
  ])
  if (!event) notFound()

  const totalRevenue = result.data
    .filter((o) => o.status === 'paid')
    .reduce((s, o) => s + o.total_amount, 0)

  return (
    <>
      <OrganizerHeader title="Orders" eyebrow="EVENT ORDERS" profile={profile} />

      <main className="content">
        {/* Summary bar */}
        <div
          style={{
            display: 'flex', gap: 24, flexWrap: 'wrap',
            padding: '16px 20px', marginBottom: 24,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', fontSize: 13,
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>TOTAL ORDERS</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, margin: 0 }}>
              {result.count}
            </p>
          </div>
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>REVENUE</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, margin: 0 }}>
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>EVENT</p>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{event.title}</p>
          </div>
        </div>

        {result.data.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} />}
            title="No orders yet"
            description="Orders will appear here once attendees start purchasing tickets."
          />
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Tickets</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                          {formatOrderId(order.id)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar
                            src={(order as unknown as { buyer: { avatar_url: string | null } }).buyer?.avatar_url}
                            name={(order as unknown as { buyer: { full_name: string | null } }).buyer?.full_name}
                            size="sm"
                          />
                          <span style={{ fontSize: 12 }}>
                            {(order as unknown as { buyer: { full_name: string | null } }).buyer?.full_name ?? 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {(order as unknown as { item_count: number }).item_count}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>
                        {formatCurrency(order.total_amount, order.currency)}
                      </td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at, 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.totalPages > 1 && (
              <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/organizer/events/${eventId}/orders?page=${p}`}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    style={{
                      display: 'grid', placeItems: 'center', width: 34, height: 34,
                      borderRadius: 'var(--radius-md)', border: '1px solid',
                      borderColor: p === page ? 'var(--organizer-accent)' : 'var(--border)',
                      background: p === page ? 'var(--organizer-accent)' : 'transparent',
                      color: p === page ? '#fff' : 'var(--foreground)',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    {p}
                  </a>
                ))}
              </nav>
            )}
          </>
        )}
      </main>
    </>
  )
}
