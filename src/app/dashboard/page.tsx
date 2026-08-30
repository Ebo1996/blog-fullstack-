import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  QrCode,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { TicketCard } from '@/components/attendee/ticket-card'
import { EventArt } from '@/components/attendee/event-art'
import {
  getMyTickets,
  getMyOrders,
  getMyNotifications,
  getUnreadNotificationCount,
} from '@/services/attendee'
import { getUpcomingEvents } from '@/services/events'
import { formatDate, formatRelative, formatCurrency } from '@/lib/utils/format'
import { EmptyState } from '@/components/ui/empty-state'
import type { Profile } from '@/types/database'
import type { TicketWithDetails } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [tickets, orders, notifications, unreadCount, upcomingEvents] =
    await Promise.all([
      getMyTickets(user.id),
      getMyOrders(user.id),
      getMyNotifications(user.id, 4),
      getUnreadNotificationCount(user.id),
      getUpcomingEvents(5),
    ])

  // Next upcoming active ticket (soonest future event)
  const now = new Date()
  const nextTicket = (tickets as TicketWithDetails[])
    .filter(
      (t) =>
        t.status === 'active' &&
        t.event?.start_at &&
        new Date(t.event.start_at) > now,
    )
    .sort(
      (a, b) =>
        new Date(a.event.start_at).getTime() -
        new Date(b.event.start_at).getTime(),
    )[0] ?? null

  // Ticket grid — next 2 active upcoming tickets
  const gridTickets = (tickets as TicketWithDetails[])
    .filter((t) => t.status === 'active')
    .slice(0, 2)

  // Notification icon + activity label map
  function activityIcon(type: string) {
    if (type.includes('ticket'))   return <Check size={15} aria-hidden="true" />
    if (type.includes('payment'))  return <CreditCard size={15} aria-hidden="true" />
    if (type.includes('transfer')) return <Users size={15} aria-hidden="true" />
    if (type.includes('rsvp'))     return <CalendarDays size={15} aria-hidden="true" />
    return <Check size={15} aria-hidden="true" />
  }

  return (
    <>
      <DashboardHeader
        title={`${greeting}, ${firstName}`}
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content">

        {/* ── HERO TICKET ──────────────────────────────────────────── */}
        {nextTicket ? (
          <section
            className="hero-ticket"
            aria-label={`Your next event: ${nextTicket.event.title}`}
          >
            <div>
              <div className="eyebrow light">YOUR NEXT EVENT</div>
              <h2>{nextTicket.event.title}</h2>
              <p className="hero-meta">
                <CalendarDays size={14} aria-hidden="true" />
                {formatDate(nextTicket.event.start_at, 'EEEE, MMMM d, yyyy')}
                <span>•</span>
                {nextTicket.event.venue_name ?? nextTicket.event.city ?? 'TBD'}
              </p>
              <div className="hero-actions">
                <Link
                  href={`/dashboard/tickets/${nextTicket.id}`}
                  className="button button-light"
                >
                  <QrCode size={15} aria-hidden="true" />
                  View ticket
                </Link>
                <button className="button button-ghost">
                  <Download size={15} aria-hidden="true" />
                  Add to wallet
                </button>
              </div>
            </div>
            <div className="hero-date" aria-hidden="true">
              <strong>
                {formatDate(nextTicket.event.start_at, 'd')}
              </strong>
              <span>
                {formatDate(nextTicket.event.start_at, 'MMM')}
                {'\n'}
                {formatDate(nextTicket.event.start_at, 'yyyy')}
              </span>
            </div>
          </section>
        ) : (
          <section
            className="hero-ticket"
            aria-label="No upcoming events"
            style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, textAlign: 'center' }}
          >
            <div className="eyebrow light">NO UPCOMING EVENTS</div>
            <h2 style={{ fontSize: 32, margin: '8px 0' }}>Nothing on the calendar yet</h2>
            <p className="hero-meta" style={{ justifyContent: 'center' }}>
              Discover something worth attending.
            </p>
            <div className="hero-actions" style={{ marginTop: 20 }}>
              <Link href="/events" className="button button-light">
                Explore events
              </Link>
            </div>
          </section>
        )}

        {/* ── YOUR TICKETS ─────────────────────────────────────────── */}
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR TICKETS</div>
            <h2>Ready when you are</h2>
          </div>
          <Link href="/dashboard/tickets" className="text-link">
            View all <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>

        {gridTickets.length > 0 ? (
          <section
            className="ticket-grid"
            aria-label="Your upcoming tickets"
          >
            {gridTickets[0] && (
              <TicketCard ticket={gridTickets[0]} featured />
            )}
            {gridTickets[1] && (
              <TicketCard ticket={gridTickets[1]} />
            )}
          </section>
        ) : (
          <EmptyState
            icon={<QrCode size={22} />}
            title="No tickets yet"
            description="When you buy a ticket, it will appear here ready to scan."
            action={{ label: 'Find events', href: '/events' }}
          />
        )}

        {/* ── UPCOMING + ACTIVITY GRID ─────────────────────────────── */}
        <div className="dashboard-grid">

          {/* Upcoming events panel */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">UPCOMING EVENTS</div>
                <h2>Find your next thing</h2>
              </div>
              <Link href="/events" className="text-link">
                Browse events <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="event-list" role="list">
              {upcomingEvents.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="event-row"
                  role="listitem"
                >
                  <EventArt title={event.title} id={event.id} small />
                  <div className="event-copy">
                    <strong>{event.title}</strong>
                    <span>
                      {formatDate(event.start_at, 'MMM d')} ·{' '}
                      {event.city ?? 'TBD'}
                    </span>
                  </div>
                  {event.category && (
                    <span className="event-tag">{event.category.name}</span>
                  )}
                  <ChevronRight
                    size={16}
                    style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                </Link>
              ))}

              {upcomingEvents.length === 0 && (
                <p
                  style={{
                    color: 'var(--muted-foreground)',
                    fontSize: 13,
                    paddingTop: 16,
                    textAlign: 'center',
                  }}
                >
                  No upcoming events right now
                </p>
              )}
            </div>
          </div>

          {/* Recent activity panel */}
          <div className="panel activity">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">RECENT ACTIVITY</div>
                <h2>What&apos;s happening</h2>
              </div>
            </div>

            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="activity-item">
                  <div className="activity-icon" aria-hidden="true">
                    {activityIcon(n.type)}
                  </div>
                  <div>
                    <strong>{n.title}</strong>
                    <span>{formatRelative(n.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="activity-item">
                    <div className="activity-icon" aria-hidden="true">
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <strong>
                        Order {order.id.slice(0, 8).toUpperCase()} confirmed
                      </strong>
                      <span>
                        {order.event.title} ·{' '}
                        {formatCurrency(order.total_amount, order.currency)}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: 13,
                      paddingTop: 16,
                      textAlign: 'center',
                    }}
                  >
                    No recent activity
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
