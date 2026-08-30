import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AttendeeHeader } from '@/components/attendee/header'
import { TransfersClient } from '@/components/attendee/transfers-client'
import { getIncomingTransfers, getOutgoingTransfers } from '@/services/transfers'
import {
  acceptTransferAction,
  rejectTransferAction,
  cancelTransferAction,
} from './actions'
import type { Profile } from '@/types/database'
import type { TransferActionResult } from './actions'

export const metadata: Metadata = { title: 'Transfers — Dashboard' }

export default async function TransfersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile) redirect('/login')

  const [incoming, outgoing] = await Promise.all([
    getIncomingTransfers(user.id),
    getOutgoingTransfers(user.id),
  ])

  // Bind server actions
  const boundAccept = async (id: string): Promise<TransferActionResult> => {
    'use server'
    return acceptTransferAction(id)
  }
  const boundReject = async (id: string): Promise<TransferActionResult> => {
    'use server'
    return rejectTransferAction(id)
  }
  const boundCancel = async (id: string): Promise<TransferActionResult> => {
    'use server'
    return cancelTransferAction(id)
  }

  const pendingIncoming = incoming.filter((t) => t.status === 'pending').length
  const pendingOutgoing = outgoing.filter((t) => t.status === 'pending').length

  return (
    <>
      <AttendeeHeader
        title="Transfers"
        eyebrow="TICKET TRANSFERS"
        profile={profile}
      />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>
            {pendingIncoming > 0 && `${pendingIncoming} incoming transfer${pendingIncoming !== 1 ? 's' : ''} need your action. `}
            {pendingOutgoing > 0 && `${pendingOutgoing} outgoing transfer${pendingOutgoing !== 1 ? 's' : ''} pending. `}
            {pendingIncoming === 0 && pendingOutgoing === 0 && 'No pending transfers.'}
          </p>
        </div>

        <TransfersClient
          incomingTransfers={incoming as never}
          outgoingTransfers={outgoing as never}
          acceptAction={boundAccept}
          rejectAction={boundReject}
          cancelAction={boundCancel}
        />
      </main>
    </>
  )
}
