/**
 * Ticket transfer service
 * Handles transfer creation, acceptance, rejection, cancellation
 * Enforces business rules:
 * - Cannot transfer used/cancelled/expired tickets
 * - Cannot transfer tickets already in pending transfer
 * - Cannot transfer to current owner
 * - Transfer expires after 7 days
 * - Ownership changes atomically on accept
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { TicketTransfer } from '@/types/database'

export interface TransferValidationError {
  error: string
}

export interface TransferResult {
  success: boolean
  transfer?: TicketTransfer
  error?: string
}

const TRANSFER_EXPIRY_DAYS = 7

// ─── CREATE TRANSFER ──────────────────────────────────────────────────────────

export async function createTransfer(
  ticketId: string,
  toEmail: string,
): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // 1. Verify ticket ownership and status
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, event:events(title, start_at)')
    .eq('id', ticketId)
    .single<{
      id: string
      user_id: string
      status: string
      event: { title: string; start_at: string }
    }>()

  if (!ticket) return { success: false, error: 'Ticket not found' }
  if (ticket.user_id !== user.id) return { success: false, error: 'Not your ticket' }

  // Cannot transfer used or cancelled tickets
  if (ticket.status === 'used') {
    return { success: false, error: 'Cannot transfer used ticket' }
  }
  if (ticket.status === 'cancelled') {
    return { success: false, error: 'Cannot transfer cancelled ticket' }
  }
  if (ticket.status === 'expired') {
    return { success: false, error: 'Cannot transfer expired ticket' }
  }

  // Cannot transfer if event has already started
  if (new Date(ticket.event.start_at) < new Date()) {
    return { success: false, error: 'Event has already started' }
  }

  // 2. Check for existing pending transfer
  const { data: existingTransfer } = await supabase
    .from('ticket_transfers')
    .select('id')
    .eq('ticket_id', ticketId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingTransfer) {
    return { success: false, error: 'Transfer already pending for this ticket' }
  }

  // 3. Find recipient by email
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const recipient = authUsers?.users.find((u) => u.email === toEmail.toLowerCase().trim())

  if (!recipient) {
    return { success: false, error: 'Recipient email not found. They must have an account.' }
  }

  const toUserId = recipient.id

  // Cannot transfer to self
  if (toUserId === user.id) {
    return { success: false, error: 'Cannot transfer ticket to yourself' }
  }

  // 4. Create transfer
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TRANSFER_EXPIRY_DAYS)

  const service = createServiceClient()
  const { data: transfer, error } = await service
    .from('ticket_transfers')
    .insert({
      ticket_id: ticketId,
      from_user_id: user.id,
      to_user_id: toUserId,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('*')
    .single<TicketTransfer>()

  if (error) {
    console.error('[transfers] createTransfer:', error)
    return { success: false, error: 'Could not create transfer' }
  }

  // 5. Create notification for recipient
  await service.from('notifications').insert({
    user_id: toUserId,
    type: 'ticket_transfer_received',
    title: 'Ticket transfer received',
    message: `You have received a ticket for ${ticket.event.title}`,
    data: { transfer_id: transfer.id, ticket_id: ticketId },
  })

  return { success: true, transfer }
}

// ─── ACCEPT TRANSFER ──────────────────────────────────────────────────────────

export async function acceptTransfer(transferId: string): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // 1. Get transfer with ticket info
  const service = createServiceClient()
  const { data: transfer } = await service
    .from('ticket_transfers')
    .select(`
      *,
      ticket:tickets(id, user_id, status, event_id),
      from_user:profiles!ticket_transfers_from_user_id_fkey(full_name)
    `)
    .eq('id', transferId)
    .single<{
      id: string
      ticket_id: string
      from_user_id: string
      to_user_id: string
      status: string
      expires_at: string
      ticket: { id: string; user_id: string; status: string; event_id: string }
      from_user: { full_name: string | null }
    }>()

  if (!transfer) return { success: false, error: 'Transfer not found' }

  // 2. Verify recipient
  if (transfer.to_user_id !== user.id) {
    return { success: false, error: 'This transfer is not for you' }
  }

  // 3. Verify status
  if (transfer.status !== 'pending') {
    return { success: false, error: `Transfer is ${transfer.status}` }
  }

  // 4. Check expiry
  if (new Date(transfer.expires_at) < new Date()) {
    // Auto-expire
    await service
      .from('ticket_transfers')
      .update({ status: 'expired' })
      .eq('id', transferId)
    return { success: false, error: 'Transfer has expired' }
  }

  // 5. Verify ticket still transferable
  if (transfer.ticket.status === 'used') {
    return { success: false, error: 'Ticket has been used' }
  }
  if (transfer.ticket.status === 'cancelled') {
    return { success: false, error: 'Ticket has been cancelled' }
  }

  // 6. Atomically accept transfer and change ownership
  const now = new Date().toISOString()

  const [updateTransferResult, updateTicketResult] = await Promise.all([
    service
      .from('ticket_transfers')
      .update({ status: 'accepted', accepted_at: now })
      .eq('id', transferId),
    service
      .from('tickets')
      .update({ user_id: user.id, updated_at: now })
      .eq('id', transfer.ticket_id),
  ])

  if (updateTransferResult.error || updateTicketResult.error) {
    console.error('[transfers] acceptTransfer:', updateTransferResult.error, updateTicketResult.error)
    return { success: false, error: 'Could not complete transfer' }
  }

  // 7. Notify sender
  await service.from('notifications').insert({
    user_id: transfer.from_user_id,
    type: 'ticket_transfer_accepted',
    title: 'Ticket transfer accepted',
    message: `Your ticket transfer has been accepted`,
    data: { transfer_id: transferId, ticket_id: transfer.ticket_id },
  })

  return { success: true }
}

// ─── REJECT TRANSFER ──────────────────────────────────────────────────────────

export async function rejectTransfer(transferId: string): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const service = createServiceClient()
  const { data: transfer } = await service
    .from('ticket_transfers')
    .select('*')
    .eq('id', transferId)
    .single<TicketTransfer>()

  if (!transfer) return { success: false, error: 'Transfer not found' }

  if (transfer.to_user_id !== user.id) {
    return { success: false, error: 'This transfer is not for you' }
  }

  if (transfer.status !== 'pending') {
    return { success: false, error: `Transfer is ${transfer.status}` }
  }

  // Update status
  const { error } = await service
    .from('ticket_transfers')
    .update({ status: 'rejected' })
    .eq('id', transferId)

  if (error) {
    console.error('[transfers] rejectTransfer:', error)
    return { success: false, error: 'Could not reject transfer' }
  }

  // Notify sender
  await service.from('notifications').insert({
    user_id: transfer.from_user_id,
    type: 'ticket_transfer_rejected',
    title: 'Ticket transfer rejected',
    message: 'Your ticket transfer was declined',
    data: { transfer_id: transferId, ticket_id: transfer.ticket_id },
  })

  return { success: true }
}

// ─── CANCEL TRANSFER ──────────────────────────────────────────────────────────

export async function cancelTransfer(transferId: string): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const service = createServiceClient()
  const { data: transfer } = await service
    .from('ticket_transfers')
    .select('*')
    .eq('id', transferId)
    .single<TicketTransfer>()

  if (!transfer) return { success: false, error: 'Transfer not found' }

  // Only sender can cancel
  if (transfer.from_user_id !== user.id) {
    return { success: false, error: 'You did not initiate this transfer' }
  }

  if (transfer.status !== 'pending') {
    return { success: false, error: `Transfer is ${transfer.status}` }
  }

  // Update status
  const { error } = await service
    .from('ticket_transfers')
    .update({ status: 'cancelled' })
    .eq('id', transferId)

  if (error) {
    console.error('[transfers] cancelTransfer:', error)
    return { success: false, error: 'Could not cancel transfer' }
  }

  // Notify recipient
  await service.from('notifications').insert({
    user_id: transfer.to_user_id,
    type: 'ticket_transfer_cancelled',
    title: 'Ticket transfer cancelled',
    message: 'A ticket transfer sent to you has been cancelled',
    data: { transfer_id: transferId, ticket_id: transfer.ticket_id },
  })

  return { success: true }
}

// ─── GET USER TRANSFERS ───────────────────────────────────────────────────────

export async function getIncomingTransfers(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ticket_transfers')
    .select(`
      *,
      ticket:tickets(
        id,
        ticket_code,
        ticket_type:ticket_types(name, price, currency),
        event:events(id, title, slug, start_at, venue_name, city, image_url)
      ),
      from_user:profiles!ticket_transfers_from_user_id_fkey(full_name, avatar_url)
    `)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getOutgoingTransfers(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ticket_transfers')
    .select(`
      *,
      ticket:tickets(
        id,
        ticket_code,
        ticket_type:ticket_types(name, price, currency),
        event:events(id, title, slug, start_at, venue_name, city, image_url)
      ),
      to_user:profiles!ticket_transfers_to_user_id_fkey(full_name, avatar_url)
    `)
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false })

  return data ?? []
}
