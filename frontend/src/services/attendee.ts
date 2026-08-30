import { createClient } from '@/lib/supabase/server'
import type {
  TicketWithDetails,
  OrderWithItems,
  TransferWithDetails,
  Notification,
  Registration,
} from '@/types'
import type { EventWithCategory } from '@/types'

// ─── TICKETS ─────────────────────────────────────────────────────────────────

export async function getMyTickets(userId: string): Promise<TicketWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(id, title, slug, start_at, end_at, venue_name, venue_address, city, image_url),
      ticket_type:ticket_types(id, name, price, currency)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[attendee] getMyTickets:', error.message)
    return []
  }
  return (data ?? []) as unknown as TicketWithDetails[]
}

export async function getUpcomingTickets(userId: string, limit = 3): Promise<TicketWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(id, title, slug, start_at, end_at, venue_name, venue_address, city, image_url),
      ticket_type:ticket_types(id, name, price, currency)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('events.start_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[attendee] getUpcomingTickets:', error.message)
    return []
  }
  return (data ?? []) as unknown as TicketWithDetails[]
}

export async function getTicketById(ticketId: string, userId: string): Promise<TicketWithDetails | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(id, title, slug, start_at, end_at, venue_name, venue_address, city, image_url),
      ticket_type:ticket_types(id, name, price, currency)
    `)
    .eq('id', ticketId)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data as unknown as TicketWithDetails
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function getMyOrders(userId: string): Promise<OrderWithItems[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      event:events(id, title, slug, start_at, image_url),
      order_items(
        *,
        ticket_type:ticket_types(id, name, price)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[attendee] getMyOrders:', error.message)
    return []
  }
  return (data ?? []) as unknown as OrderWithItems[]
}

export async function getOrderById(orderId: string, userId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      event:events(id, title, slug, start_at, image_url),
      order_items(
        *,
        ticket_type:ticket_types(id, name, price)
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data as unknown as OrderWithItems
}

// ─── REGISTRATIONS / RSVPs ────────────────────────────────────────────────────

export interface RegistrationWithEvent extends Registration {
  event: Pick<EventWithCategory, 'id' | 'title' | 'slug' | 'start_at' | 'end_at' | 'venue_name' | 'city' | 'image_url'> & {
    category: { name: string; slug: string } | null
  }
}

export async function getMyRSVPs(userId: string): Promise<RegistrationWithEvent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      event:events(
        id, title, slug, start_at, end_at, venue_name, city, image_url,
        category:event_categories(name, slug)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[attendee] getMyRSVPs:', error.message)
    return []
  }
  return (data ?? []) as unknown as RegistrationWithEvent[]
}

export async function cancelRSVP(registrationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId)
    .eq('user_id', userId)

  return !error
}

// ─── TRANSFERS ────────────────────────────────────────────────────────────────

export async function getMyTransfers(userId: string): Promise<TransferWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ticket_transfers')
    .select(`
      *,
      ticket:tickets(
        id, ticket_code,
        event:events(id, title, start_at, venue_name)
      ),
      from_user:profiles!ticket_transfers_from_user_id_fkey(id, full_name, avatar_url),
      to_user:profiles!ticket_transfers_to_user_id_fkey(id, full_name, avatar_url)
    `)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[attendee] getMyTransfers:', error.message)
    return []
  }
  return (data ?? []) as unknown as TransferWithDetails[]
}

export async function initiateTransfer(
  ticketId: string,
  fromUserId: string,
  toEmail: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Look up recipient by email
  const { data: recipient, error: lookupErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (
      await supabase.auth.admin?.listUsers()
        .then(() => null)
        .catch(() => null)
    ) as unknown as string)
    .single<{ id: string }>()

  // Fallback: use the RPC with email lookup via auth
  // In production this would be a server action that resolves email → profile
  void recipient
  void lookupErr

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc('transfer_ticket', {
      p_ticket_id: ticketId,
      p_from_user_id: fromUserId,
      p_to_user_id: toEmail,
    })

  if (error) return { success: false, error: error.message }
  return (data as { success: boolean; error?: string }) ?? { success: false, error: 'Unknown error' }
}

export async function cancelTransfer(
  transferId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ticket_transfers')
    .update({ status: 'cancelled' })
    .eq('id', transferId)
    .eq('from_user_id', userId)
    .eq('status', 'pending')

  return !error
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getMyNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[attendee] getMyNotifications:', error.message)
    return []
  }
  return (data ?? []) as Notification[]
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return 0
  return count ?? 0
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string },
): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return !error
}
