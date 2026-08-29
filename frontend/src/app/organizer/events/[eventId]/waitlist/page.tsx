import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEventWaitlist, getWaitlistStats } from '@/services/waitlist'
import { WaitlistManagement } from '@/components/organizer/waitlist-management'
import { notifyWaitlistAction } from './actions'

export const metadata = {
  title: 'Waitlist Management',
  description: 'Manage event waitlist',
}

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function EventWaitlistPage({ params }: Props) {
  const { eventId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', eventId)
    .single()

  if (!event || event.organizer_id !== user.id) {
    redirect('/organizer/events')
  }

  const [entries, stats] = await Promise.all([
    getEventWaitlist(eventId, user.id),
    getWaitlistStats(eventId, user.id),
  ])

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Waitlist Management</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      <WaitlistManagement
        eventId={eventId}
        entries={entries}
        stats={stats}
        onNotify={notifyWaitlistAction}
      />
    </div>
  )
}
