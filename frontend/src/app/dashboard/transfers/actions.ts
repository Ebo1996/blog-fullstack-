'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Accept incoming transfer (calls the atomic RPC) ──────────────────────────
export async function acceptTransferAction(transferId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Validate the transfer is addressed to this user and still pending
  const { data: transfer, error: fetchErr } = await supabase
    .from('ticket_transfers')
    .select('id, to_user_id, status, expires_at')
    .eq('id', transferId)
    .eq('to_user_id', user.id)
    .single<{ id: string; to_user_id: string; status: string; expires_at: string }>()

  if (fetchErr || !transfer) return { error: 'Transfer not found.' }
  if (transfer.status !== 'pending') return { error: 'This transfer is no longer pending.' }
  if (new Date(transfer.expires_at) < new Date()) return { error: 'This transfer has expired.' }

  // Call the atomic RPC — cast to any because our Database type doesn't include this RPC yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: rpcErr } = await (supabase as any).rpc('accept_ticket_transfer', {
    p_transfer_id: transferId,
  })

  if (rpcErr) {
    console.error('[transfers] accept RPC error:', rpcErr.message)
    return { error: 'Could not accept transfer. Please try again.' }
  }

  const result = data as { success: boolean; error?: string }
  if (!result?.success) return { error: (result as { error?: string })?.error ?? 'Transfer failed.' }

  // Notify the sender via service client
  const service = createServiceClient()
  const { data: fullTransfer } = await service
    .from('ticket_transfers')
    .select('from_user_id, ticket:tickets(event:events(title))')
    .eq('id', transferId)
    .single<{ from_user_id: string; ticket: { event: { title: string } } }>()

  if (fullTransfer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).rpc('create_notification', {
      p_user_id: fullTransfer.from_user_id,
      p_type:    'ticket_transfer_accepted',
      p_title:   'Transfer accepted',
      p_message: `Your ticket transfer for ${fullTransfer.ticket.event.title} was accepted.`,
      p_data:    { transfer_id: transferId },
    })
  }

  revalidatePath('/dashboard/transfers')
  revalidatePath('/dashboard/tickets')
  return {}
}

// ─── Reject incoming transfer ─────────────────────────────────────────────────
export async function rejectTransferAction(transferId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ticket_transfers')
    .update({ status: 'rejected' })
    .eq('id', transferId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: 'Could not reject transfer.' }

  // Notify the sender
  const service = createServiceClient()
  const { data: fullTransfer } = await service
    .from('ticket_transfers')
    .select('from_user_id, ticket:tickets(event:events(title))')
    .eq('id', transferId)
    .single<{ from_user_id: string; ticket: { event: { title: string } } }>()

  if (fullTransfer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).rpc('create_notification', {
      p_user_id: fullTransfer.from_user_id,
      p_type:    'ticket_transfer_rejected',
      p_title:   'Transfer declined',
      p_message: `Your ticket transfer for ${fullTransfer.ticket.event.title} was declined.`,
      p_data:    { transfer_id: transferId },
    })
  }

  revalidatePath('/dashboard/transfers')
  return {}
}

// ─── Cancel outgoing transfer ─────────────────────────────────────────────────
export async function cancelTransferAction(transferId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ticket_transfers')
    .update({ status: 'cancelled' })
    .eq('id', transferId)
    .eq('from_user_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: 'Could not cancel transfer.' }

  revalidatePath('/dashboard/transfers')
  revalidatePath('/dashboard/tickets')
  return {}
}
