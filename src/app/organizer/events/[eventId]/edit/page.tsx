import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EventForm } from '@/components/organizer/event-form'
import { getAllCategories } from '@/services/categories'
import { getOrganizerEventById } from '@/services/organizer'
import { updateEventAction } from '../../actions'
import type { Profile } from '@/types/database'
import type { ActionResult } from '../../actions'

// Force dynamic rendering to ensure cookies() is called in request context
export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ eventId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const event = await getOrganizerEventById(eventId, user.id)
  return { title: event ? `Edit: ${event.title}` : 'Edit Event' }
}

export default async function EditEventPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const [event, categories] = await Promise.all([
    getOrganizerEventById(eventId, user.id),
    getAllCategories(),
  ])

  if (!event) notFound()

  // Bind eventId into the server action
  const boundAction = async (
    prev: ActionResult,
    formData: FormData,
  ): Promise<ActionResult> => {
    'use server'
    return updateEventAction(eventId, prev, formData)
  }

  return (
    <>
      <OrganizerHeader
        title={`Edit: ${event.title}`}
        eyebrow="EDIT EVENT"
        profile={profile}
      />

      <main className="content" style={{ maxWidth: 760 }}>
        <div className="panel">
          <EventForm
            action={boundAction}
            categories={categories}
            event={event}
            submitLabel="Save changes"
          />
        </div>
      </main>
    </>
  )
}
