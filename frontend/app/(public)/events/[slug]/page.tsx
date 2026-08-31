import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EventCard } from '@/components/events/event-card'
import { TicketPurchasePanel } from './ticket-purchase-panel'
import { formatDateTime, getEventColorClass, truncate } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eventify.et'

async function getEvent(slug: string) {
  try {
    const res = await fetch(`${API_URL}/events/${slug}`, { next: { revalidate: 60 } })
    if (res.status === 404) return null
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch { return null }
}

async function getTicketTypes(eventId: string) {
  try {
    const res = await fetch(`${API_URL}/events/${eventId}/ticket-types`, { next: { revalidate: 30 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

async function getRelated(eventId: string) {
  try {
    const res = await fetch(`${API_URL}/events/${eventId}/related?limit=4`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

// ── SEO metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await getEvent(params.slug)
  if (!event) return { title: 'Event not found' }
  const canonicalUrl = `${SITE_URL}/events/${params.slug}`
  return {
    title: `${event.title} | Eventify Ethiopia`,
    description: truncate(event.description, 160),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: event.title,
      description: truncate(event.description, 160),
      images: event.imageUrl ? [{ url: event.imageUrl, width: 1200, height: 630, alt: event.title }] : [],
      type: 'website',
      url: canonicalUrl,
      siteName: 'Eventify Ethiopia',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: truncate(event.description, 160),
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────
export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug)
  if (!event) notFound()

  const [ticketTypes, related] = await Promise.all([
    getTicketTypes(event._id),
    getRelated(event._id),
  ])

  const categoryName = typeof event.categoryId === 'object' ? event.categoryId?.name : null
  const isCancelled = event.status === 'cancelled'
  const isCompleted = event.status === 'completed'
  const canPurchase = !isCancelled && !isCompleted

  // ── JSON-LD structured data (schema.org/Event) ─────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: truncate(event.description, 300),
    startDate: event.startAt,
    endDate: event.endAt,
    eventStatus: isCancelled
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.type === 'online'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.venue ? {
      '@type': 'Place',
      name: event.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue.address,
        addressLocality: event.venue.city,
        addressCountry: event.venue.country ?? 'ET',
      },
    } : undefined,
    image: event.imageUrl ? [event.imageUrl] : undefined,
    organizer: event.organizerId && typeof event.organizerId === 'object' ? {
      '@type': 'Organization',
      name: event.organizerId.name,
    } : undefined,
    offers: ticketTypes.length > 0
      ? ticketTypes.map((tt: any) => ({
          '@type': 'Offer',
          name: tt.name,
          price: tt.price,
          priceCurrency: tt.currency ?? 'ETB',
          availability: tt.soldQuantity >= tt.quantity
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/events/${event.slug}`,
        }))
      : undefined,
    url: `${SITE_URL}/events/${event.slug}`,
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      {/* JSON-LD structured data — injected into <head> by Next.js */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── Left: event info ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero image */}
          <div className="rounded-[var(--radius-lg)] overflow-hidden aspect-video relative bg-[var(--muted)]">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <div className={`event-art w-full h-full text-6xl font-light ${getEventColorClass(0)}`}>
                <span className="relative z-10">{event.title.slice(0, 2)}</span>
              </div>
            )}
            {isCancelled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="badge badge-danger text-base px-5 py-2">Event Cancelled</span>
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {categoryName && <span className="eyebrow">{categoryName}</span>}
              {isCancelled && <Badge variant="danger" dot>Cancelled</Badge>}
              {isCompleted && <Badge variant="neutral" dot>Completed</Badge>}
              {event.isFeatured && <Badge variant="warning">Featured</Badge>}
            </div>
            <h1
              className="text-serif"
              style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.1, marginBottom: 20 }}
            >
              {event.title}
            </h1>

            <div className="flex flex-col gap-3 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                <span>{formatDateTime(event.startAt)}</span>
                {event.endAt && (
                  <span className="text-xs">— {formatDateTime(event.endAt)}</span>
                )}
              </div>
              {event.venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  <div>
                    {event.venue.name && (
                      <p className="font-medium text-[var(--foreground)]">{event.venue.name}</p>
                    )}
                    <p>
                      {[event.venue.address, event.venue.city, event.venue.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                  <span>Capacity: {event.capacity.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-[var(--muted-foreground)] uppercase mb-4">
              About this event
            </h2>
            <div
              className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap"
              style={{ lineHeight: 1.8 }}
            >
              {event.description}
            </div>
          </div>

          {/* Tags */}
          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs border border-[var(--border)] text-[var(--muted-foreground)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Organizer */}
          {event.organizerId && typeof event.organizerId === 'object' && (
            <div className="panel flex items-center gap-4">
              <div className="avatar w-12 h-12 text-sm flex-shrink-0">
                {event.organizerId.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="eyebrow mb-1">Organized by</p>
                <p className="font-semibold text-sm">{event.organizerId.name}</p>
                {event.organizerId.bio && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                    {event.organizerId.bio}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: sticky ticket panel ────────────────────────── */}
        <div className="lg:sticky lg:top-24" id="tickets-panel">
          <TicketPurchasePanel
            event={event}
            ticketTypes={ticketTypes}
            canPurchase={canPurchase}
          />
        </div>
      </div>

      {/* ── Mobile sticky bottom CTA (hidden on lg+) ─────────────── */}
      {canPurchase && ticketTypes.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{event.title}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {ticketTypes.some((t: any) => t.price === 0)
                ? 'Free'
                : `From ETB ${Math.min(...ticketTypes.map((t: any) => t.price)).toLocaleString()}`}
            </p>
          </div>
          <a
            href="#tickets-panel"
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('tickets-panel')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Get tickets
          </a>
        </div>
      )}

      {/* Related events */}
      {related.length > 0 && (
        <section className="mt-20 pt-10 border-t border-[var(--border)]">
          <div className="section-heading mb-6">
            <div>
              <span className="eyebrow">You might also like</span>
              <h2 className="text-serif" style={{ fontSize: 26, marginTop: 6 }}>
                Related events
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((ev: any, i: number) => (
              <EventCard key={ev._id} event={ev} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
