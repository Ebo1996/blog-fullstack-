import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime, formatCurrency, getEventColorClass } from '@/lib/utils'

interface EventCardProps {
  event: {
    _id: string
    title: string
    slug: string
    imageUrl?: string
    startAt: string
    endAt: string
    venue?: { name?: string; city?: string; country?: string }
    minPrice?: number
    currency?: string
    status?: string
    categoryId?: { name: string; color?: string } | string
    availableTickets?: number
    isFeatured?: boolean
  }
  index?: number
}

function AvailabilityBadge({
  status,
  minPrice,
  availableTickets,
}: {
  status?: string
  minPrice?: number
  availableTickets?: number
}) {
  if (status === 'cancelled') return <Badge variant="danger" dot>Cancelled</Badge>
  if (status === 'completed') return <Badge variant="neutral" dot>Completed</Badge>
  if (availableTickets === 0) return <Badge variant="danger" dot>Sold out</Badge>
  if (availableTickets !== undefined && availableTickets <= 10)
    return <Badge variant="warning" dot>Few left</Badge>
  if (minPrice === 0) return <Badge variant="success" dot>Free</Badge>
  return <Badge variant="success" dot>Available</Badge>
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const colorClass = getEventColorClass(index)
  const categoryName = typeof event.categoryId === 'object' && event.categoryId
    ? event.categoryId.name
    : null

  return (
    <Link href={`/events/${event.slug}`} className="event-card group" aria-label={event.title}>
      {/* Image */}
      <div className="event-card-img">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className={`event-art w-full h-full text-4xl font-light ${colorClass}`}>
            <span className="relative z-10">
              {event.title.split(' ').map((w) => w[0]).join('').slice(0, 3)}
            </span>
          </div>
        )}
        {event.isFeatured && (
          <span className="absolute top-3 left-3 badge badge-warning text-[9px]">Featured</span>
        )}
      </div>

      {/* Body */}
      <div className="event-card-body">
        {categoryName && (
          <span className="eyebrow">{categoryName}</span>
        )}
        <h3 className="event-card-title line-clamp-2">{event.title}</h3>
        <div className="event-card-meta">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {formatDate(event.startAt)} · {formatTime(event.startAt)}
          </span>
          {event.venue?.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {event.venue.name ? `${event.venue.name}, ` : ''}{event.venue.city}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="event-card-footer">
        <AvailabilityBadge
          status={event.status}
          minPrice={event.minPrice}
          availableTickets={event.availableTickets}
        />
        <span className="text-xs font-semibold">
          {event.minPrice != null && event.minPrice > 0
            ? `From ${formatCurrency(event.minPrice, event.currency)}`
            : event.minPrice === 0
            ? 'Free'
            : '—'}
        </span>
      </div>
    </Link>
  )
}
