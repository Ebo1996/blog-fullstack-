import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/attendee/sidebar'
import { getMyTickets, getUnreadNotificationCount } from '@/services/attendee'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify role — only attendees land here (organizers/admins redirect in middleware)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  if (profile.role === 'admin') redirect('/admin')
  if (profile.role === 'organizer') redirect('/organizer')

  const [tickets, unreadCount] = await Promise.all([
    getMyTickets(user.id),
    getUnreadNotificationCount(user.id),
  ])

  const activeTicketCount = tickets.filter((t) => t.status === 'active').length

  return (
    <div className="app-shell">
      <DashboardSidebar
        profile={profile}
        ticketCount={activeTicketCount}
        unreadCount={unreadCount}
      />
      <div className="main">{children}</div>
    </div>
  )
}
