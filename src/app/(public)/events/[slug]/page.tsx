import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  CalendarDays, MapPin, Clock, Users, ArrowLeft,
  ExternalLink, ChevronRight,
} from 'lucide-react'
import { getEventBySlug, getFeaturedEvents } from '@/services/events'
import { TicketPurchasePanel } from '@/components/public/ticket-purchase-panel'
import { EventCardRow } from '@/components/public/event-card'
import { CopyLinkButton } from '@/components/public/copy-link-button'
import { Avatar } from '@/components/ui/avatar'
import { EventStatusBadge } from '@/components/ui/badge'
import { formatDate, formatDateRange, formatNumber } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/server'
import type { EventWithCategory } from '@/types'

interface EventPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return { title: 'Event not found' }
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? undefined,
      images: event.image_url ? [event.image_url] : [],
    },
  }
}

const artColors = ['event-violet', 'event-amber', 'event-teal', 'event-rose', 'event-indigo', 'event-sage']
function getArtColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return artColors[sum % artColors.length]
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  const [event, moreEvents] = await Promise.all([
    getEventBySlug(slug),
    getFeaturedEvents(4),
  ])

  if (!event) notFound()

  // Check auth state server-side — panel uses this to show sign-in prompt
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  const relatedEvents = (moreEvents as EventWithCategory[]).filter((e) => e.id !== event.id).slice(0, 3)
  const color = getArtColor(event.id)
  const isPast = new Date(event.end_at) < new Date()
  const totalCapacity = event.capacity
  const totalSold = event.ticket_types?.reduce((s, t) => s + t.sold_quantity, 0) ?? 0
  const availabilityPct = totalCapacity ? Math.round((totalSold / totalCapacity) * 100) : null

  return (
    <main className="event-detail-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 24 }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none', padding: 0, margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>
          <li><Link href="/events" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={12} aria-hidden="true" />Events</Link></li>
          {event.category && (
            <>
              <li aria-hidden="true"><ChevronRight size={11} /></li>
              <li><Link href={`/categories/${event.category.slug}`}>{event.category.name}</Link></li>
            </>
          )}
          <li aria-hidden="true"><ChevronRight size={11} /></li>
          <li aria-current="page" style={{ color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{event.title}</li>
        </ol>
      </nav>

      <div className="event-detail-grid">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div>
          {/* Hero image / artwork */}
          <div
            style={{
              borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              aspectRatio: '16/7', marginBottom: 32, position: 'relative',
            }}
            aria-hidden={!event.image_url}
          >
            {event.image_url ? (
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                priority
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            ) : (
              <div
                className={`event-art ${color}`}
                style={{ width: '100%', height: '100%', borderRadius: 0, fontSize: 80, letterSpacing: '-0.12em' }}
              >
                <span>
                  {event.title.split(' ').slice(0, 3).map((w) => w[0]).join('')}
                </span>
              </div>
            )}
            {/* Status overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              {event.category && (
                <span style={{
                  background: 'rgba(17,17,15,0.85)', backdropFilter: 'blur(6px)',
                  borderRadius: 'var(--radius-full)', padding: '4px 12px',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--primary)', textTransform: 'uppercase',
                }}>
                  {event.category.name}
                </span>
              )}
              {isPast && <EventStatusBadge status="completed" />}
            </div>
          </div>

          {/* Title + meta */}
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 400, letterSpacing: '-0.03em',
              margin: '0 0 20px', lineHeight: 1.05,
            }}
          >
            {event.title}
          </h1>

          {/* Key info chips */}
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 20,
              marginBottom: 32, color: 'var(--muted-foreground)', fontSize: 13,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarDays size={14} aria-hidden="true" style={{ color: 'var(--primary)' }} />
              {formatDateRange(event.start_at, event.end_at)}
            </span>
            {event.venue_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={14} aria-hidden="true" style={{ color: 'var(--primary)' }} />
                {event.venue_name}
                {event.city && ` · ${event.city}`}
              </span>
            )}
            {totalCapacity && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Users size={14} aria-hidden="true" style={{ color: 'var(--primary)' }} />
                {formatNumber(totalCapacity)} capacity
                {availabilityPct !== null && availabilityPct >= 80 && (
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                    · {100 - availabilityPct}% remaining
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 0', borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)', marginBottom: 32,
              }}
            >
              <Avatar
                src={event.organizer.avatar_url}
                name={event.organizer.full_name}
                size="md"
              />
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px' }}>
                  Organised by
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                  {event.organizer.full_name ?? 'Unknown organizer'}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <section aria-label="About this event" style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
                About this event
              </h2>
              <div
                style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted-foreground)', whiteSpace: 'pre-wrap' }}
              >
                {event.description}
              </div>
            </section>
          )}

          {/* Venue */}
          {(event.venue_name || event.venue_address) && (
            <section aria-label="Venue details" style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
                Venue
              </h2>
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{event.venue_name}</p>
                {event.venue_address && (
                  <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} aria-hidden="true" />
                    {[event.venue_address, event.city, event.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {event.venue_address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent([event.venue_name, event.venue_address, event.city].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                  >
                    Open in Google Maps <ExternalLink size={11} aria-hidden="true" />
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Date & time */}
          <section aria-label="Date and time" style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
              Date & time
            </h2>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={15} aria-hidden="true" style={{ color: 'var(--primary)' }} />
                {formatDate(event.start_at, 'EEEE, MMMM d, yyyy')}
              </p>
              <p style={{ fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)' }}>
                <Clock size={15} aria-hidden="true" />
                {formatDate(event.start_at, 'h:mm a')} — {formatDate(event.end_at, 'h:mm a')}
              </p>
            </div>
          </section>

          {/* Share */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Share this event:</span>
            <CopyLinkButton title={event.title} />
          </div>

          {/* Related events — below all left-column content, outside the sticky right panel */}
          {relatedEvents.length > 0 && (
            <div className="panel" style={{ marginTop: 40 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 12 }}>
                You might also like
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {relatedEvents.map((e) => (
                  <EventCardRow key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: ticket panel only, fully sticky ────────────── */}
        <div className="event-detail-panel">
          {isPast ? (
            <div className="panel" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, margin: '0 0 8px' }}>
                This event has ended
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px' }}>
                Check out upcoming events you might enjoy.
              </p>
              <Link href="/events" className="button button-outline" style={{ width: '100%', justifyContent: 'center' }}>
                Browse events
              </Link>
            </div>
          ) : (
            <TicketPurchasePanel
              eventId={event.id}
              eventSlug={event.slug}
              ticketTypes={event.ticket_types ?? []}
              eventTitle={event.title}
              startAt={event.start_at}
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>
      </div>
    </main>
  )
}

// ─── Inline copy-link button extracted to components/public/copy-link-button.tsx
