import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserWaitlistEntries } from '@/services/waitlist'
import { WaitlistEntries } from '@/components/attendee/waitlist-entries'
import { removeFromWaitlistAction } from './actions'

export const metadata = {
  title: 'Waitlist - Dashboard',
  description: 'Manage your event waitlist entries',
}

export default async function WaitlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/dashboard/waitlist')
  }

  const entries = await getUserWaitlistEntries(user.id)

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Waitlist</h1>
        <p className="text-muted-foreground">
          Track your position in event waitlists. You'll be notified when tickets become available.
        </p>
      </div>

      <WaitlistEntries entries={entries} onRemove={removeFromWaitlistAction} />
    </div>
  )
}
