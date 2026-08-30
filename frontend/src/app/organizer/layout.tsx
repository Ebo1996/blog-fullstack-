import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizerSidebar } from '@/components/organizer/sidebar'
import type { Profile } from '@/types/database'

/**
 * Root organizer layout — applies to /organizer, /organizer/events, /organizer/settings.
 * Routes under /organizer/events/[eventId] have their own nested layout
 * that overrides app-shell with the event sub-nav sidebar.
 */
export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')
  if (profile.role === 'attendee') redirect('/dashboard')
  // admin can also use the organizer dashboard

  return (
    <div className="app-shell organizer-shell">
      <OrganizerSidebar profile={profile} />
      <div className="main">{children}</div>
    </div>
  )
}
