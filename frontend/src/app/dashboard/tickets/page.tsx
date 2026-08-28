import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { TicketCard } from '@/components/attendee/ticket-card'
import { EmptyState } from '@/components/ui/empty-state'
import { getMyTickets, getUnreadNotificationCount } from '@/services/attendee'
import type { Profile } from '@/types/database'
import type { TicketWithDetails } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Tickets' }

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const [tickets, unreadCount] = await Promise.all([
    getMyTickets(user.id),
    getUnreadNotificationCount(user.id),
  ])

  const now = new Date()
  const upcoming = (tickets as TicketWithDetails[]).filter(
    (t) => t.status === 'active' && new Date(t.event.start_at) >= now,
  )
  const past = (tickets as TicketWithDetails[]).filter(
    (t) => t.status !== 'active' || new Date(t.event.start_at) < now,
  )

  return (
    <>
      <DashboardHeader
        title="My tickets"
        eyebrow="YOUR COLLECTION"
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content">
        {/* Page intro */}
        <div className="page-intro">
          <p>Everything you need for the events you&apos;re going to.</p>
          <Link href="/events" className="button button-dark">
            <Search size={14} aria-hidden="true" />
            Find events
          </Link>
        </div>

        {tickets.length === 0 ? (
          <EmptyState
            icon={<QrCode size={24} />}
            title="No tickets yet"
            description="Tickets you purchase will appear here with a scannable QR code."
            action={{ label: 'Browse events', href: '/events' }}
          />
        ) : (
          <>
            {/* ── Upcoming ─────────────────────────────────────── */}
            {upcoming.length > 0 && (
              <>
                <div className="section-heading" style={{ marginTop: 8 }}>
                  <div>
                    <div className="eyebrow">UPCOMING</div>
                    <h2>Ready when you are</h2>
                  </div>
                </div>
                <section
                  className="ticket-grid ticket-grid-wide"
                  aria-label="Upcoming tickets"
                >
                  {upcoming.map((ticket, i) => (
                    <TicketCard key={ticket.id} ticket={ticket} featured={i === 0} />
                  ))}
                </section>
              </>
            )}

            {/* ── Past / used ───────────────────────────────────── */}
            {past.length > 0 && (
              <>
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">PAST</div>
                    <h2>Where you&apos;ve been</h2>
                  </div>
                </div>
                <section
                  className="ticket-grid ticket-grid-wide"
                  aria-label="Past tickets"
                >
                  {past.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
