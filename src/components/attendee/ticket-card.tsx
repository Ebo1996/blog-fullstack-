import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { EventArt } from './event-art'
import { formatDate } from '@/lib/utils/format'
import type { TicketWithDetails } from '@/types'

// Status dot — matches prototype's .status classes exactly
function TicketStatus({ status }: { status: string }) {
  const tone =
    status === 'active'      ? 'success' :
    status === 'used'        ? 'neutral' :
    status === 'transferred' ? 'neutral' :
    status === 'cancelled'   ? 'warning' :
    'neutral'

  const label =
    status === 'active'      ? 'Confirmed' :
    status === 'used'        ? 'Used' :
    status === 'transferred' ? 'Transferred' :
    status === 'cancelled'   ? 'Cancelled' :
    status === 'expired'     ? 'Expired' :
    'Active'

  return (
    <span className={`status${tone !== 'success' ? ` status-${tone}` : ''}`}>
      <span className="status-dot" />
      {label}
    </span>
  )
}

interface TicketCardProps {
  ticket: TicketWithDetails
  featured?: boolean
}

export function TicketCard({ ticket, featured = false }: TicketCardProps) {
  const event = ticket.event
  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className={`ticket-card${featured ? ' ticket-featured' : ''}`}
      aria-label={`${event.title} ticket — ${ticket.status}`}
    >
      <EventArt title={event.title} id={event.id} />
      <div className="ticket-info">
        <TicketStatus status={ticket.status} />
        <h3>{event.title}</h3>
        <p>
          {formatDate(event.start_at, 'MMM d, yyyy')}
          <br />
          {event.venue_name ?? event.city ?? 'TBD'}
        </p>
      </div>
      <QrCode className="ticket-qr" aria-hidden="true" />
    </Link>
  )
}
