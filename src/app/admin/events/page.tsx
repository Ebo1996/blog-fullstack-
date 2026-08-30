import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { EventsClient } from '@/components/admin/events-client'
import { getAdminEvents } from '@/services/admin'
import { adminSetEventStatusAction } from '../actions'
import type { Profile, EventStatus } from '@/types/database'
import type { AdminActionResult } from '../actions'

export const metadata: Metadata = { title: 'Admin — Events' }

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: events, count } = await getAdminEvents('', undefined, 1)

  const boundSetStatus = async (id: string, status: EventStatus): Promise<AdminActionResult> => {
    'use server'
    return adminSetEventStatusAction(id, status)
  }

  return (
    <>
      <AdminHeader title="Events" eyebrow="EVENT MODERATION" profile={profile} />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>{count} event{count !== 1 ? 's' : ''} across the platform.</p>
        </div>

        <EventsClient events={events} setStatusAction={boundSetStatus} />
      </main>
    </>
  )
}
