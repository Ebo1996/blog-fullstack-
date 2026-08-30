/**
 * Waitlist service
 * Handles event waitlist functionality - joining, notification, and conversion
 */

import { createServiceClient } from '@/lib/supabase/service'
import { createNotification } from './notifications'

export interface WaitlistEntry {
  id: string
  user_id: string
  user_email: string
  user_name: string
  ticket_type_id: string
  ticket_type_name: string
  quantity: number
  waitlist_position: number
  notified_at: string | null
  created_at: string
}

export interface WaitlistResult {
  success: boolean
  registration_id: string | null
  position: number
  error: string | null
}

// ─── JOIN WAITLIST ────────────────────────────────────────────────────────────

export async function joinWaitlist(
  eventId: string,
  userId: string,
  ticketTypeId: string,
  quantity: number = 1,
): Promise<WaitlistResult> {
  const service = createServiceClient()

  const { data, error } = await service.rpc('add_to_waitlist', {
    p_event_id: eventId,
    p_user_id: userId,
    p_ticket_type_id: ticketTypeId,
    p_quantity: quantity,
  })

  if (error) {
    console.error('[waitlist] joinWaitlist:', error)
    return { success: false, registration_id: null, position: 0, error: 'Could not join waitlist' }
  }

  const result = (data as unknown[])[0] as WaitlistResult
  
  if (result.success) {
    // Create notification for the user
    await createNotification({
      user_id: userId,
      type: 'waitlist_joined',
      title: 'Joined Waitlist',
      message: `You've been added to the waitlist at position #${result.position}. We'll notify you when tickets become available.`,
      link: `/events/${eventId}`,
    })
  }

  return result
}

// ─── GET USER WAITLIST ENTRIES ────────────────────────────────────────────────

export async function getUserWaitlistEntries(userId: string) {
  const service = createServiceClient()

  const { data, error } = await service
    .from('registrations')
    .select(`
      id,
      quantity,
      waitlist_position,
      notified_at,
      created_at,
      event:events(
        id,
        title,
        slug,
        start_time,
        location,
        image_url
      ),
      ticket_type:ticket_types(
        id,
        name,
        price
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'waitlist')
    .order('waitlist_position', { ascending: true })

  if (error) {
    console.error('[waitlist] getUserWaitlistEntries:', error)
    return []
  }

  return data ?? []
}

// ─── GET EVENT WAITLIST ───────────────────────────────────────────────────────

export async function getEventWaitlist(
  eventId: string,
  organizerId: string,
  limit?: number,
): Promise<WaitlistEntry[]> {
  const service = createServiceClient()

  // Verify ownership
  const { data: event } = await service
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single<{ organizer_id: string }>()

  if (!event || event.organizer_id !== organizerId) return []

  const { data, error } = await service.rpc('get_event_waitlist', {
    p_event_id: eventId,
    p_limit: limit ?? null,
  })

  if (error) {
    console.error('[waitlist] getEventWaitlist:', error)
    return []
  }

  return (data ?? []) as WaitlistEntry[]
}

// ─── NOTIFY WAITLIST USERS ────────────────────────────────────────────────────

export async function notifyWaitlistUsers(
  eventId: string,
  ticketTypeId: string,
  availableSlots: number,
): Promise<number> {
  const service = createServiceClient()

  // Get waitlist entries for this ticket type
  const { data: entries } = await service
    .from('registrations')
    .select('id, user_id, quantity, waitlist_position')
    .eq('event_id', eventId)
    .eq('ticket_type_id', ticketTypeId)
    .eq('status', 'waitlist')
    .is('notified_at', null)
    .order('waitlist_position', { ascending: true })
    .limit(availableSlots)

  if (!entries || entries.length === 0) return 0

  let notifiedCount = 0

  // Get event details for notification
  const { data: event } = await service
    .from('events')
    .select('title, slug')
    .eq('id', eventId)
    .single<{ title: string; slug: string }>()

  if (!event) return 0

  // Notify users
  for (const entry of entries) {
    const typedEntry = entry as { id: string; user_id: string; quantity: number; waitlist_position: number }
    
    // Create notification
    await createNotification({
      user_id: typedEntry.user_id,
      type: 'waitlist_available',
      title: 'Tickets Available!',
      message: `Tickets are now available for ${event.title}. Complete your purchase within 24 hours.`,
      link: `/events/${event.slug}/checkout?waitlist=${typedEntry.id}`,
    })

    // Mark as notified
    await service.rpc('mark_waitlist_notified', {
      p_registration_id: typedEntry.id,
    })

    notifiedCount++
  }

  return notifiedCount
}

// ─── REMOVE FROM WAITLIST ─────────────────────────────────────────────────────

export async function removeFromWaitlist(
  registrationId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const service = createServiceClient()

  const { data, error } = await service.rpc('remove_from_waitlist', {
    p_registration_id: registrationId,
    p_user_id: userId,
  })

  if (error) {
    console.error('[waitlist] removeFromWaitlist:', error)
    return { success: false, error: 'Could not remove from waitlist' }
  }

  return { success: data as boolean }
}

// ─── CONVERT WAITLIST TO PURCHASE ─────────────────────────────────────────────

export async function convertWaitlistToPurchase(
  registrationId: string,
  orderId: string,
): Promise<boolean> {
  const service = createServiceClient()

  const { data, error } = await service.rpc('convert_waitlist_to_active', {
    p_registration_id: registrationId,
    p_order_id: orderId,
  })

  if (error) {
    console.error('[waitlist] convertWaitlistToPurchase:', error)
    return false
  }

  return data as boolean
}

// ─── CHECK EVENT AVAILABILITY ─────────────────────────────────────────────────

export async function checkEventAvailability(eventId: string) {
  const service = createServiceClient()

  const { data: ticketTypes } = await service
    .from('ticket_types')
    .select('id, name, capacity, sold')
    .eq('event_id', eventId)

  if (!ticketTypes) return { available: false, soldOut: true }

  const hasAvailability = ticketTypes.some(
    (tt) => (tt as { capacity: number; sold: number }).capacity > (tt as { capacity: number; sold: number }).sold,
  )

  return {
    available: hasAvailability,
    soldOut: !hasAvailability,
    ticketTypes: ticketTypes.map((tt) => ({
      id: (tt as { id: string }).id,
      name: (tt as { name: string }).name,
      available: (tt as { capacity: number; sold: number }).capacity - (tt as { capacity: number; sold: number }).sold,
    })),
  }
}

// ─── GET WAITLIST STATS ───────────────────────────────────────────────────────

export async function getWaitlistStats(eventId: string, organizerId: string) {
  const service = createServiceClient()

  // Verify ownership
  const { data: event } = await service
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single<{ organizer_id: string }>()

  if (!event || event.organizer_id !== organizerId) return null

  // Get total waitlist count
  const { count: totalCount } = await service
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'waitlist')

  // Get notified count
  const { count: notifiedCount } = await service
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'waitlist')
    .not('notified_at', 'is', null)

  // Get waitlist by ticket type
  const { data: byTicketType } = await service
    .from('registrations')
    .select(`
      ticket_type_id,
      ticket_type:ticket_types(name),
      quantity
    `)
    .eq('event_id', eventId)
    .eq('status', 'waitlist')

  const ticketTypeStats = (byTicketType ?? []).reduce(
    (acc, entry) => {
      const typedEntry = entry as { ticket_type_id: string; ticket_type: { name: string }; quantity: number }
      const typeId = typedEntry.ticket_type_id
      if (!acc[typeId]) {
        acc[typeId] = {
          name: typedEntry.ticket_type.name,
          count: 0,
        }
      }
      acc[typeId].count += typedEntry.quantity
      return acc
    },
    {} as Record<string, { name: string; count: number }>,
  )

  return {
    total: totalCount ?? 0,
    notified: notifiedCount ?? 0,
    pending: (totalCount ?? 0) - (notifiedCount ?? 0),
    byTicketType: Object.values(ticketTypeStats),
  }
}
