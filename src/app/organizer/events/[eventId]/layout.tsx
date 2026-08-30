import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizerSidebar } from '@/components/organizer/sidebar'
import { getOrganizerEventById } from '@/services/organizer'
import type { Profile } from '@/types/database'

interface Props {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

/**
 * Event-scoped layout — replaces the root organizer layout for all
 * /organizer/events/[eventId]/* routes so the sidebar can show
 * the contextual event sub-navigation.
 */
export default async function EventLayout({ children, params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  if (!profile) redirect('/login')
  if (profile.role === 'attendee') redirect('/dashboard')

  // Verify the event belongs to this organizer (also works for admin)
  const event = profile.role === 'admin'
    ? await (async () => {
        const { data } = await supabase
          .from('events')
          .select('id, title')
          .eq('id', eventId)
          .single<{ id: string; title: string }>()
        return data
      })()
    : await getOrganizerEventById(eventId, user.id).then((e) =>
        e ? { id: e.id, title: e.title } : null,
      )

  if (!event) notFound()

  return (
    <div className="app-shell organizer-shell">
      <OrganizerSidebar
        profile={profile}
        activeEventId={event.id}
        activeEventTitle={event.title}
      />
      <div className="main">{children}</div>
    </div>
  )
}
