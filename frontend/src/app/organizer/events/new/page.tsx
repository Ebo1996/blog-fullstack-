import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EventForm } from '@/components/organizer/event-form'
import { getAllCategories } from '@/services/categories'
import { createEventAction } from '../actions'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Create Event' }

// Force dynamic rendering to ensure cookies() is called in request context
export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const categories = await getAllCategories()

  return (
    <>
      <OrganizerHeader
        title="Create event"
        eyebrow="NEW EVENT"
        profile={profile}
      />

      <main className="content" style={{ maxWidth: 760 }}>
        {/* Intro */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, margin: 0, lineHeight: 1.65 }}>
            Fill in the details below. Your event will be saved as a draft — you can publish it once you&apos;ve added ticket types.
          </p>
        </div>

        <div className="panel">
          <EventForm
            action={createEventAction}
            categories={categories}
            submitLabel="Save draft"
          />
        </div>
      </main>
    </>
  )
}
