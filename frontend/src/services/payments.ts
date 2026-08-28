/**
 * Payment / order service
 * Server-side only — used by pages and API routes.
 * The actual atomic ticket creation is done by the purchase_tickets() PostgreSQL
 * RPC called from the Stripe webhook handler. This service provides status
 * polling and order lookup helpers used by the success/cancel pages.
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { OrderStatus } from '@/types/database'

// ─── Order status polling (used by success page) ──────────────────────────────

export interface OrderStatusResult {
  status: OrderStatus | null
  ticketCount: number
  eventTitle: string
  eventSlug: string
}

export async function getOrderStatus(
  orderId: string,
  userId: string,
): Promise<OrderStatusResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      event:events(title, slug),
      tickets:tickets(count)
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single<{
      id: string
      status: OrderStatus
      event: { title: string; slug: string }
      tickets: Array<{ count: number }>
    }>()

  if (error || !data) {
    return { status: null, ticketCount: 0, eventTitle: '', eventSlug: '' }
  }

  return {
    status:     data.status,
    ticketCount: (data.tickets as unknown as [{ count: number }])[0]?.count ?? 0,
    eventTitle: data.event.title,
    eventSlug:  data.event.slug,
  }
}

// ─── Cancel a pending order (used by cancel page) ─────────────────────────────
// Only cancels if the order is still pending — paid orders are managed by Stripe.

export async function cancelPendingOrder(
  orderId: string,
  userId: string,
): Promise<boolean> {
  const service = createServiceClient()

  const { data: order } = await service
    .from('orders')
    .select('id, status, user_id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single<{ id: string; status: string; user_id: string }>()

  if (!order || order.status !== 'pending') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'pending') // double-guard: only cancel if still pending

  return !error
}

// ─── Tickets for a paid order (used by success page) ─────────────────────────

export interface OrderTicketSummary {
  id: string
  ticket_code: string
  ticket_type_name: string
  event_title: string
  event_start_at: string
  venue_name: string | null
}

export async function getTicketsForOrder(
  orderId: string,
  userId: string,
): Promise<OrderTicketSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_code,
      ticket_type:ticket_types(name),
      event:events(title, start_at, venue_name)
    `)
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .neq('status', 'cancelled')

  if (error || !data) return []

  return (data as unknown as Array<{
    id: string
    ticket_code: string
    ticket_type: { name: string }
    event: { title: string; start_at: string; venue_name: string | null }
  }>).map((t) => ({
    id:               t.id,
    ticket_code:      t.ticket_code,
    ticket_type_name: t.ticket_type.name,
    event_title:      t.event.title,
    event_start_at:   t.event.start_at,
    venue_name:       t.event.venue_name,
  }))
}

// ─── RSVP to a free event ─────────────────────────────────────────────────────

export interface RSVPResult {
  success: boolean
  status?: 'confirmed' | 'waitlisted'
  error?: string
}

export async function rsvpToEvent(
  eventId: string,
  userId: string,
): Promise<RSVPResult> {
  const supabase = await createClient()

  // Check event exists + is published
  const { data: event } = await supabase
    .from('events')
    .select('id, title, status, capacity')
    .eq('id', eventId)
    .eq('status', 'published')
    .single<{ id: string; title: string; status: string; capacity: number | null }>()

  if (!event) return { success: false, error: 'Event not found.' }

  // Check for existing RSVP
  const { data: existing } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle<{ id: string; status: string }>()

  if (existing) {
    if (existing.status === 'confirmed') return { success: true, status: 'confirmed' }
    if (existing.status === 'waitlisted') return { success: true, status: 'waitlisted' }

    // Re-confirm a previously cancelled RSVP
    const service = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('registrations')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    return { success: true, status: 'confirmed' }
  }

  // Check capacity for waitlist
  let rsvpStatus: 'confirmed' | 'waitlisted' = 'confirmed'
  if (event.capacity) {
    const { count } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if ((count ?? 0) >= event.capacity) {
      rsvpStatus = 'waitlisted'
    }
  }

  // Insert RSVP
  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (service as any)
    .from('registrations')
    .insert({ event_id: eventId, user_id: userId, status: rsvpStatus })

  if (insertErr) {
    // Handle unique constraint violation gracefully
    if (insertErr.code === '23505') return { success: true, status: 'confirmed' }
    return { success: false, error: 'Could not RSVP. Please try again.' }
  }

  // Notify
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).rpc('create_notification', {
    p_user_id: userId,
    p_type:    rsvpStatus === 'confirmed' ? 'rsvp_confirmed' : 'rsvp_waitlisted',
    p_title:   rsvpStatus === 'confirmed' ? 'RSVP confirmed' : 'Added to waitlist',
    p_message: rsvpStatus === 'confirmed'
      ? `You're confirmed for ${event.title}!`
      : `You've been added to the waitlist for ${event.title}.`,
    p_data: { event_id: eventId },
  })

  return { success: true, status: rsvpStatus }
}
