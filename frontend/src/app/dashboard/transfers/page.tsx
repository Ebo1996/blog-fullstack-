import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import { TransfersClient } from '@/components/attendee/transfers-client'
import { getMyTransfers, getUnreadNotificationCount } from '@/services/attendee'
import {
  acceptTransferAction,
  rejectTransferAction,
  cancelTransferAction,
} from './actions'
import type { Profile } from '@/types/database'
import type { TransferWithDetails } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transfers' }

export default async function TransfersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const [transfers, unreadCount] = await Promise.all([
    getMyTransfers(user.id),
    getUnreadNotificationCount(user.id),
  ])

  const incoming = (transfers as TransferWithDetails[]).filter(
    (t) => t.to_user_id === user.id,
  )
  const outgoing = (transfers as TransferWithDetails[]).filter(
    (t) => t.from_user_id === user.id,
  )

  const pendingIncoming = incoming.filter((t) => t.status === 'pending').length

  return (
    <>
      <DashboardHeader
        title="Transfers"
        eyebrow="TICKET SHARING"
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content">
        <div className="page-intro">
          <p>Share tickets with friends, without the group-chat chaos.</p>
          {pendingIncoming > 0 && (
            <span
              className="badge badge-warning"
              style={{ fontSize: 11 }}
              aria-live="polite"
            >
              {pendingIncoming} pending
            </span>
          )}
        </div>

        <TransfersClient
          incoming={incoming}
          outgoing={outgoing}
          currentUserId={user.id}
          acceptAction={acceptTransferAction}
          rejectAction={rejectTransferAction}
          cancelAction={cancelTransferAction}
        />
      </main>
    </>
  )
}
