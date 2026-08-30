import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { AttendeesClient } from '@/components/organizer/attendees-client'
import { EmptyState } from '@/components/ui/empty-state'
import { getOrganizerEventById, getEventAttendees } from '@/services/organizer'
import { Users } from 'lucide-react'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Attendees' }

interface Props { params: Promise<{ eventId: string }> }

export default async function AttendeesPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const [event, attendees] = await Promise.all([
    getOrganizerEventById(eventId, user.id),
    getEventAttendees(eventId, user.id),
  ])
  if (!event) notFound()

  return (
    <>
      <OrganizerHeader title="Attendees" eyebrow="GUEST LIST" profile={profile} />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>{attendees.length} attendee{attendees.length !== 1 ? 's' : ''} · {event.title}</p>
        </div>

        {attendees.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No attendees yet"
            description="Attendees will appear here once tickets are purchased."
          />
        ) : (
          <AttendeesClient attendees={attendees} eventTitle={event.title} />
        )}
      </main>
    </>
  )
}
