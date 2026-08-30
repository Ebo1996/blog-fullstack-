import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowUpRight, CalendarDays, CreditCard,
  Plus, TrendingUp, Ticket, BarChart2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { StatCard } from '@/components/ui/stat-card'
import { EventStatusBadge, OrderStatusBadge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getOrganizerStats,
  getOrganizerEvents,
  getRecentOrdersForOrganizer,
} from '@/services/organizer'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format'
import { EventArt } from '@/components/attendee/event-art'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Organizer Overview' }

export default async function OrganizerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  const [stats, eventsResult, recentOrders] = await Promise.all([
    getOrganizerStats(user.id),
    getOrganizerEvents(user.id, 1),
    getRecentOrdersForOrganizer(user.id, 5),
  ])

  const upcomingEvents = eventsResult.data
    .filter((e) => e.status === 'published' && new Date(e.start_at) > new Date())
    .slice(0, 5)

  return (
    <>
      <OrganizerHeader
        title={`Welcome back, ${firstName}`}
        profile={profile}
        showNewEvent
      />

      <main className="content">

        {/* ── Stats grid ────────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <StatCard
            label="Total events"
            value={formatNumber(stats.totalEvents)}
            icon={<CalendarDays size={16} />}
          />
          <StatCard
            label="Published"
            value={formatNumber(stats.publishedEvents)}
            icon={<TrendingUp size={16} />}
            delta={`${stats.upcomingEvents} upcoming`}
            deltaDirection="neutral"
          />
          <StatCard
            label="Tickets sold"
            value={formatNumber(stats.totalTicketsSold)}
            icon={<Ticket size={16} />}
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<BarChart2 size={16} />}
          />
        </div>

        {/* ── Two-column grid ───────────────────────────────────── */}
        <div className="dashboard-grid" style={{ marginTop: 0 }}>

          {/* ── Upcoming events ─────────────────────────────────── */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">YOUR EVENTS</div>
                <h2>Upcoming</h2>
              </div>
              <Link href="/organizer/events" className="text-link">
                All events <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div style={{ paddingTop: 24 }}>
                <EmptyState
                  icon={<CalendarDays size={22} />}
                  title="No upcoming events"
                  description="Create your first event and start selling tickets."
                  action={{ label: 'Create event', href: '/organizer/events/new' }}
                />
              </div>
            ) : (
              <div className="event-list" role="list">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/organizer/events/${event.id}`}
                    className="event-row"
                    role="listitem"
                  >
                    <EventArt title={event.title} id={event.id} small />
                    <div className="event-copy" style={{ flex: 1, minWidth: 0 }}>
                      <strong>{event.title}</strong>
                      <span>
                        {formatDate(event.start_at, 'MMM d, yyyy')} ·{' '}
                        {event.city ?? 'TBD'}
                      </span>
                    </div>
                    <EventStatusBadge status={event.status} />
                    <ArrowUpRight
                      size={15}
                      style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/organizer/events/new"
              className="button button-outline"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20, gap: 6 }}
            >
              <Plus size={14} aria-hidden="true" />
              Create new event
            </Link>
          </div>

          {/* ── Recent orders ────────────────────────────────────── */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">SALES</div>
                <h2>Recent orders</h2>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ paddingTop: 24 }}>
                <EmptyState
                  icon={<CreditCard size={22} />}
                  title="No orders yet"
                  description="Orders will appear here once attendees start purchasing."
                />
              </div>
            ) : (
              <div className="activity" role="list">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/organizer/events/${order.event.id}/orders`}
                    className="activity-item"
                    role="listitem"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="activity-icon" aria-hidden="true">
                      <CreditCard size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar
                          src={order.buyer.avatar_url}
                          name={order.buyer.full_name}
                          size="sm"
                        />
                        {order.buyer.full_name ?? 'Attendee'}
                      </strong>
                      <span style={{ marginTop: 3 }}>
                        {order.event.title} ·{' '}
                        {formatCurrency(order.total_amount, order.currency)}
                      </span>
                    </div>
                    <OrderStatusBadge status={order.status as 'paid'} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────────── */}
        {stats.totalEvents === 0 && (
          <div
            style={{
              marginTop: 32,
              background: 'var(--organizer-accent-bg)',
              border: '1px solid rgba(124,106,245,0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 32px',
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <p className="eyebrow" style={{ color: 'var(--organizer-accent)', marginBottom: 8 }}>
                GET STARTED
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(20px, 3vw, 28px)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  margin: '0 0 8px',
                }}
              >
                Create your first event
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                Set up your event, add ticket types, publish, and start selling — all in minutes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/organizer/events/new"
                className="button button-primary"
                style={{ gap: 7 }}
              >
                <Plus size={14} aria-hidden="true" />
                Create event
              </Link>
              <Link href="/about" className="button button-outline">
                Learn more
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
