import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import { EventCard } from '@/components/events/event-card'
import { getInitials, formatDate } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

async function getOrganizerEvents(slug: string) {
  // slug here is actually the user ID — events are filtered by organizerId
  try {
    const res = await fetch(
      `${API_URL}/events?organizer=${slug}&limit=12&sort=soonest`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const events = data.data?.events ?? data.data ?? []
    if (events.length === 0) return null
    const organizer = events[0]?.organizerId
    return { organizer, events }
  } catch { return null }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getOrganizerEvents(params.slug)
  if (!result?.organizer) return { title: 'Organizer not found' }
  return {
    title: `${result.organizer.name} — Events`,
    description: `Discover events organized by ${result.organizer.name} on Eventify Ethiopia.`,
  }
}

export default async function OrganizerPage({ params }: { params: { slug: string } }) {
  const result = await getOrganizerEvents(params.slug)
  if (!result) notFound()

  const { organizer, events } = result

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <Link href="/events"
        className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All events
      </Link>

      {/* Organizer profile */}
      <div className="panel flex items-center gap-5 mb-10">
        <div className="avatar flex items-center justify-center font-bold flex-shrink-0"
          style={{ width: 64, height: 64, fontSize: 22 }}>
          {organizer?.image
            ? <Image src={organizer.image} alt={organizer.name} width={64} height={64} className="rounded-full object-cover" />
            : getInitials(organizer?.name ?? '')}
        </div>
        <div>
          <span className="eyebrow mb-1 block">Organizer</span>
          <h1 className="text-serif" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>
            {organizer?.name}
          </h1>
          {organizer?.bio && (
            <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-lg">{organizer.bio}</p>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="section-heading mb-6">
        <div>
          <span className="eyebrow">Events</span>
          <h2 className="text-serif" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', marginTop: 6 }}>
            Upcoming events by {organizer?.name?.split(' ')[0]}
          </h2>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No published events yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.map((event: any, i: number) => (
            <EventCard key={event._id} event={event} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
