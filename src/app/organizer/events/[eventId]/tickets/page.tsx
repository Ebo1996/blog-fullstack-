import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EventStatusBadge } from '@/components/ui/badge'
import { TicketTypesClient } from '@/components/organizer/ticket-types-client'
import { getOrganizerEventById } from '@/services/organizer'
import {
  createTicketTypeAction,
  updateTicketTypeAction,
  deleteTicketTypeAction,
} from '../../actions'
import type { Profile } from '@/types/database'
import type { ActionResult } from '../../actions'

interface Props { params: Promise<{ eventId: string }> }

export const metadata: Metadata = { title: 'Ticket Types' }

export default async function TicketsManagePage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const event = await getOrganizerEventById(eventId, user.id)
  if (!event) notFound()

  // Bind server actions
  const boundCreate = async (
    prev: ActionResult,
    fd: FormData,
  ): Promise<ActionResult> => {
    'use server'
    return createTicketTypeAction(eventId, prev, fd)
  }

  const boundUpdate = async (
    ttId: string,
    prev: ActionResult,
    fd: FormData,
  ): Promise<ActionResult> => {
    'use server'
    return updateTicketTypeAction(ttId, eventId, prev, fd)
  }

  const boundDelete = async (ttId: string): Promise<ActionResult> => {
    'use server'
    return deleteTicketTypeAction(ttId, eventId)
  }

  return (
    <>
      <OrganizerHeader
        title="Ticket types"
        eyebrow="TICKETS"
        profile={profile}
      />

      <main className="content" style={{ maxWidth: 760 }}>
        {/* Event context bar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 24, padding: '12px 16px',
            background: 'var(--muted)', borderRadius: 'var(--radius-md)',
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 600 }}>{event.title}</span>
          <EventStatusBadge status={event.status} />
        </div>

        <TicketTypesClient
          eventId={eventId}
          ticketTypes={event.ticket_types ?? []}
          createAction={boundCreate}
          updateAction={boundUpdate}
          deleteAction={boundDelete}
          isPublished={event.status === 'published'}
        />
      </main>
    </>
  )
}
