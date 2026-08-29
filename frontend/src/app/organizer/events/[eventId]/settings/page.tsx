import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EventStatusActions } from '@/components/organizer/event-status-actions'
import { EventStatusBadge } from '@/components/ui/badge'
import { getOrganizerEventById } from '@/services/organizer'
import { formatDate } from '@/lib/utils/format'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Event Settings' }

interface Props { params: Promise<{ eventId: string }> }

export default async function EventSettingsPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const event = await getOrganizerEventById(eventId, user.id)
  if (!event) notFound()

  const isPast       = new Date(event.end_at) < new Date()
  const isDraft      = event.status === 'draft'
  const isPublished  = event.status === 'published'

  return (
    <>
      <OrganizerHeader title="Event settings" eyebrow="SETTINGS" profile={profile} />

      <main className="content" style={{ maxWidth: 680 }}>

        {/* Event info */}
        <div className="settings-panel">
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <div>
              <strong>Event</strong>
              <span>{event.title}</span>
            </div>
            <EventStatusBadge status={event.status} />
          </div>
          <div className="setting-row">
            <div>
              <strong>Dates</strong>
              <span>
                {formatDate(event.start_at, 'EEE, MMM d, yyyy · h:mm a')} →{' '}
                {formatDate(event.end_at, 'h:mm a')}
              </span>
            </div>
            <Link
              href={`/organizer/events/${eventId}/edit`}
              className="button button-outline button-sm"
            >
              Edit
            </Link>
          </div>
          <div className="setting-row">
            <div>
              <strong>Public page</strong>
              <span>View how attendees see this event.</span>
            </div>
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-outline button-sm"
              style={{ gap: 6 }}
            >
              <ExternalLink size={12} aria-hidden="true" />
              View
            </Link>
          </div>
        </div>

        {/* Publish / status controls */}
        <div className="settings-panel" style={{ marginTop: 20 }}>
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <div>
              <strong>Event status</strong>
              <span>
                {isDraft
                  ? 'Draft — not visible to the public.'
                  : isPublished
                    ? 'Published — tickets are on sale.'
                    : `Status: ${event.status}`}
              </span>
            </div>
          </div>
          <div className="setting-row" style={{ paddingBottom: 0 }}>
            <div>
              <strong>Change status</strong>
              <span>Publish, unpublish, or cancel this event.</span>
            </div>
            <EventStatusActions
              eventId={eventId}
              currentStatus={event.status}
              isDraft={isDraft}
              isPublished={isPublished}
              isPast={isPast}
            />
          </div>
        </div>

        {/* Danger zone */}
        {isDraft && (
          <div
            className="settings-panel"
            style={{ marginTop: 20, borderColor: 'rgba(224,107,107,0.3)' }}
          >
            <div className="setting-row" style={{ paddingTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <strong>Delete event</strong>
                  <span>Permanently delete this draft. This cannot be undone.</span>
                </div>
              </div>
            </div>
            <div className="setting-row" style={{ paddingBottom: 0 }}>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
                Only draft events with no orders can be deleted.
                Published events must be cancelled instead.
              </p>
              <EventStatusActions
                eventId={eventId}
                currentStatus={event.status}
                isDraft={isDraft}
                isPublished={false}
                isPast={isPast}
              />
            </div>
          </div>
        )}
      </main>
    </>
  )
}
