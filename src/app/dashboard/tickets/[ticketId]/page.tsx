import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { EventArt } from '@/components/attendee/event-art'
import { TicketQRCode } from '@/components/attendee/qr-code'
import { TransferButton } from '@/components/attendee/transfer-dialog'
import { getTicketById, getUnreadNotificationCount } from '@/services/attendee'
import { formatDate } from '@/lib/utils/format'
import { TicketStatusBadge } from '@/components/ui/badge'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ ticketId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketId } = await params
  return { title: `Ticket ${ticketId.slice(0, 8).toUpperCase()}` }
}

export default async function TicketDetailPage({ params }: Props) {
  const { ticketId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const [ticket, unreadCount] = await Promise.all([
    getTicketById(ticketId, user.id),
    getUnreadNotificationCount(user.id),
  ])

  if (!ticket) notFound()

  const event = ticket.event
  const isTransferable = ticket.status === 'active'

  return (
    <>
      <DashboardHeader
        title={event.title}
        eyebrow={`MY TICKETS / ${event.title.toUpperCase()}`}
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content detail-content">
        {/* Back link */}
        <Link href="/dashboard/tickets" className="back-link">
          ← Back to tickets
        </Link>

        {/* ── Digital ticket card — exact prototype ─────────────── */}
        <section
          className="digital-ticket"
          aria-label={`Digital ticket for ${event.title}`}
        >
          {/* Top row: event info + small artwork */}
          <div className="digital-top">
            <div>
              <TicketStatusBadge status={ticket.status} />
              <h2>{event.title}</h2>
              <p>
                {formatDate(event.start_at, 'EEEE, MMMM d, yyyy · h:mm a')}
              </p>
              <p>
                {[event.venue_name, event.venue_address, event.city]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
            <EventArt title={event.title} id={event.id} small />
          </div>

          {/* QR code */}
          <div className="qr-box">
            <TicketQRCode token={ticket.qr_token} size={145} />
            <strong>Scan at entry</strong>
            <span>Ticket ID: {ticket.ticket_code}</span>
          </div>

          {/* Bottom metadata row */}
          <div className="digital-bottom">
            <div>
              <span>ATTENDEE</span>
              <strong>{profile?.full_name ?? 'You'}</strong>
            </div>
            <div>
              <span>TYPE</span>
              <strong>{ticket.ticket_type.name}</strong>
            </div>
            <div>
              <span>DATE</span>
              <strong>{formatDate(event.start_at, 'MMM d, yyyy')}</strong>
            </div>
            <div>
              <span>VENUE</span>
              <strong>{event.venue_name ?? event.city ?? 'TBD'}</strong>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="detail-actions">
          <button className="button button-dark">
            <Download size={14} aria-hidden="true" />
            Add to wallet
          </button>
          {isTransferable && (
            <TransferButton
              ticketId={ticket.id}
              eventTitle={event.title}
            />
          )}
        </div>

        {/* Status notices */}
        {ticket.status === 'used' && (
          <div
            className="alert alert-info"
            role="status"
            style={{ marginTop: 20, maxWidth: 480 }}
          >
            This ticket was scanned on{' '}
            {ticket.checked_in_at
              ? formatDate(ticket.checked_in_at, 'MMM d, yyyy · h:mm a')
              : 'event day'}.
          </div>
        )}
        {ticket.status === 'transferred' && (
          <div
            className="alert alert-warning"
            role="status"
            style={{ marginTop: 20, maxWidth: 480 }}
          >
            This ticket has been transferred to another attendee.
          </div>
        )}
        {ticket.status === 'cancelled' && (
          <div
            className="alert alert-error"
            role="status"
            style={{ marginTop: 20, maxWidth: 480 }}
          >
            This ticket has been cancelled.{' '}
            <Link href="/events" style={{ color: 'var(--error)', fontWeight: 700 }}>
              Find another event →
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
