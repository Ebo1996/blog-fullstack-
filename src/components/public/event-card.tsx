import Link from 'next/link'
// Note: hover effects handled via CSS className, not inline JS handlers
import Image from 'next/image'
import { CalendarDays, MapPin, ArrowUpRight } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import type { EventWithCategory } from '@/types'

// ─── Color palette for events without images ─────────────────────────────────
const artColors = [
  'event-violet', 'event-amber', 'event-teal',
  'event-rose', 'event-indigo', 'event-sage',
]

function getArtColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return artColors[sum % artColors.length] ?? 'event-violet'
}

function getInitials(title: string) {
  return title
    .split(' ')
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Featured / large card ────────────────────────────────────────────────────
export function EventCardFeatured({ event, minPrice }: { event: EventWithCategory; minPrice?: number | null }) {
  const color = getArtColor(event.id)
  return (
    <Link
      href={`/events/${event.slug}`}
      className="ticket-card"
      style={{ minHeight: 220 }}
      aria-label={`${event.title} — ${formatDate(event.start_at)}`}
    >
      {/* Artwork / image */}
      {event.image_url ? (
        <div style={{ width: '42%', minHeight: '100%', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 800px) 42vw, 220px"
          />
        </div>
      ) : (
        <div className={`event-art ${color}`} aria-hidden="true">
          <span>{getInitials(event.title)}</span>
        </div>
      )}

      {/* Info */}
      <div className="ticket-info">
        {event.category && (
          <span className="status status-neutral" style={{ marginBottom: 2 }}>
            <span className="status-dot" />
            {event.category.name}
          </span>
        )}
        <h3 style={{ fontSize: 22 }}>{event.title}</h3>
        <p style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarDays size={11} aria-hidden="true" />
            {formatDate(event.start_at, 'EEE, MMM d, yyyy')}
          </span>
          {event.city && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} aria-hidden="true" />
              {event.city}
            </span>
          )}
        </p>
        {minPrice !== undefined && minPrice !== null && (
          <p style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
            {minPrice === 0 ? 'Free' : `From ${formatCurrency(minPrice)}`}
          </p>
        )}
      </div>

      <ArrowUpRight className="ticket-qr" aria-hidden="true" />
    </Link>
  )
}

// ─── Standard grid card ───────────────────────────────────────────────────────
export function EventCard({ event, minPrice }: { event: EventWithCategory; minPrice?: number | null }) {
  const color = getArtColor(event.id)

  return (
    <Link
      href={`/events/${event.slug}`}
      aria-label={`${event.title} — ${formatDate(event.start_at)}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'transform var(--transition-base), border-color var(--transition-base)',
        textDecoration: 'none',
      }}
      className="event-card-link"
    >
      {/* Image / artwork */}
      <div style={{ height: 160, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`event-art ${color}`}
            style={{ width: '100%', height: '100%', borderRadius: 0, fontSize: 40 }}
            aria-hidden="true"
          >
            <span>{getInitials(event.title)}</span>
          </div>
        )}
        {event.category && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(17,17,15,0.82)',
              backdropFilter: 'blur(4px)',
              borderRadius: 'var(--radius-full)',
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--primary)',
              textTransform: 'uppercase',
            }}
          >
            {event.category.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 400, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {event.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--muted-foreground)', fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarDays size={11} aria-hidden="true" />
            {formatDate(event.start_at, 'EEE, MMM d, yyyy · h:mm a')}
          </span>
          {(event.venue_name || event.city) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} aria-hidden="true" />
              {[event.venue_name, event.city].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: minPrice === 0 ? 'var(--success)' : 'var(--foreground)' }}>
            {minPrice == null ? '' : minPrice === 0 ? 'Free' : `From ${formatCurrency(minPrice)}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            View <ArrowUpRight size={11} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Compact row card (used in sidebar / recent lists) ────────────────────────
export function EventCardRow({ event }: { event: EventWithCategory }) {
  const color = getArtColor(event.id)
  return (
    <Link href={`/events/${event.slug}`} className="event-row" style={{ gap: 12, padding: '12px 0' }}>
      <div className={`event-art event-art-small ${color}`} aria-hidden="true">
        <span style={{ fontSize: 12 }}>{getInitials(event.title)}</span>
      </div>
      <div className="event-copy">
        <strong>{event.title}</strong>
        <span>{formatDate(event.start_at)} · {event.city ?? 'TBD'}</span>
      </div>
      {event.category && <span className="event-tag">{event.category.name}</span>}
      <ArrowUpRight size={15} style={{ marginLeft: 'auto', color: 'var(--muted-foreground)', flexShrink: 0 }} aria-hidden="true" />
    </Link>
  )
}
