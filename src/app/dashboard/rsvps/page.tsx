import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, ChevronRight, MapPin, X, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { RegistrationStatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { EventArt } from '@/components/attendee/event-art'
import { getMyRSVPs, getUnreadNotificationCount } from '@/services/attendee'
import { formatDate, isUpcoming, isPast } from '@/lib/utils/format'
import type { Profile } from '@/types/database'
import type { RegistrationWithEvent } from '@/services/attendee'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'RSVPs' }

// ─── RSVPs are server-rendered; cancel action uses a server action ────────────
import { cancelRSVPAction } from './actions'

export default async function RSVPsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const [rsvps, unreadCount] = await Promise.all([
    getMyRSVPs(user.id),
    getUnreadNotificationCount(user.id),
  ])

  const upcoming   = rsvps.filter((r) => r.status !== 'cancelled' && r.event?.start_at && isUpcoming(r.event.start_at))
  const past       = rsvps.filter((r) => r.status !== 'cancelled' && r.event?.start_at && isPast(r.event.start_at))
  const cancelled  = rsvps.filter((r) => r.status === 'cancelled')

  return (
    <>
      <DashboardHeader
        title="RSVPs"
        eyebrow="YOUR EVENTS"
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content">
        <div className="page-intro">
          <p>Events you&apos;ve said yes to.</p>
          <Link href="/events" className="button button-dark">
            <CalendarDays size={14} aria-hidden="true" />
            Browse events
          </Link>
        </div>

        {rsvps.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="No RSVPs yet"
            description="RSVP to free events and they'll appear here."
            action={{ label: 'Find events', href: '/events' }}
          />
        ) : (
          <>
            {/* ── Upcoming ──────────────────────────────────────── */}
            {upcoming.length > 0 && (
              <RSVPSection
                title="Upcoming"
                eyebrow="CONFIRMED"
                items={upcoming}
                cancelAction={cancelRSVPAction}
              />
            )}

            {/* ── Past ─────────────────────────────────────────── */}
            {past.length > 0 && (
              <RSVPSection
                title="Past"
                eyebrow="ATTENDED"
                items={past}
                cancelAction={cancelRSVPAction}
                showCancel={false}
              />
            )}

            {/* ── Cancelled ────────────────────────────────────── */}
            {cancelled.length > 0 && (
              <RSVPSection
                title="Cancelled"
                eyebrow="CANCELLED"
                items={cancelled}
                cancelAction={cancelRSVPAction}
                showCancel={false}
              />
            )}
          </>
        )}
      </main>
    </>
  )
}

// ─── RSVPSection ──────────────────────────────────────────────────────────────

function RSVPSection({
  title,
  eyebrow,
  items,
  cancelAction,
  showCancel = true,
}: {
  title: string
  eyebrow: string
  items: RegistrationWithEvent[]
  cancelAction: (id: string) => Promise<void>
  showCancel?: boolean
}) {
  return (
    <>
      <div className="section-heading" style={{ marginTop: 32 }}>
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
      </div>

      <section className="panel list-panel" aria-label={`${title} RSVPs`}>
        {items.map((rsvp) => (
          <RSVPRow
            key={rsvp.id}
            rsvp={rsvp}
            cancelAction={cancelAction}
            showCancel={showCancel && rsvp.status === 'confirmed'}
          />
        ))}
      </section>
    </>
  )
}

// ─── RSVPRow ──────────────────────────────────────────────────────────────────

function RSVPRow({
  rsvp,
  cancelAction,
  showCancel,
}: {
  rsvp: RegistrationWithEvent
  cancelAction: (id: string) => Promise<void>
  showCancel: boolean
}) {
  const event = rsvp.event
  return (
    <div className="order-row" style={{ alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16 }}>
      {/* Icon */}
      <div className="order-icon" aria-hidden="true">
        {rsvp.status === 'waitlisted'
          ? <Clock size={15} />
          : rsvp.status === 'cancelled'
            ? <X size={15} />
            : <CalendarDays size={15} />
        }
      </div>

      {/* Artwork */}
      <EventArt title={event.title} id={event.id} small />

      {/* Info */}
      <div className="event-copy" style={{ flex: 1, minWidth: 0 }}>
        <strong>{event.title}</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <CalendarDays size={10} aria-hidden="true" />
          {formatDate(event.start_at, 'EEE, MMM d, yyyy')}
        </span>
        {event.venue_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <MapPin size={10} aria-hidden="true" />
            {[event.venue_name, event.city].filter(Boolean).join(', ')}
          </span>
        )}
      </div>

      {/* Status + actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <RegistrationStatusBadge status={rsvp.status} />

        <div style={{ display: 'flex', gap: 6 }}>
          <Link
            href={`/events/${event.slug}`}
            className="button button-outline button-sm"
            style={{ fontSize: 10 }}
          >
            View event <ChevronRight size={11} aria-hidden="true" />
          </Link>

          {showCancel && (
            <form
              action={async () => {
                'use server'
                await cancelAction(rsvp.id)
              }}
            >
              <button
                type="submit"
                className="button button-sm"
                style={{
                  background: 'var(--error-bg)',
                  color: 'var(--error)',
                  border: 0,
                  fontSize: 10,
                }}
                aria-label={`Cancel RSVP for ${event.title}`}
              >
                Cancel RSVP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
