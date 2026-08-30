/**
 * Organizer service layer — all queries are scoped to the authenticated organizer.
 * No organizer can read or modify another organizer's data.
 * RLS enforces this at the database level; we also add explicit .eq('organizer_id') guards.
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { slugify } from '@/lib/utils/format'
import type {
  Event,
  EventStatus,
  TicketType,
  TicketTypeStatus,
  Order,
  OrderStatus,
  Profile,
} from '@/types/database'
import type { EventFull, PaginatedResult } from '@/types'

const PAGE_SIZE = 20

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizerStats {
  totalEvents: number
  publishedEvents: number
  totalTicketsSold: number
  totalRevenue: number        // cents
  upcomingEvents: number
}

export interface AttendeeRow {
  ticket_id: string
  ticket_code: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  ticket_type_name: string
  order_status: OrderStatus
  checked_in: boolean
  checked_in_at: string | null
  purchased_at: string
}

export interface CheckInRow {
  id: string
  ticket_id: string
  ticket_code: string
  attendee_name: string | null
  ticket_type_name: string
  checked_in_at: string
  checked_in_by_name: string | null
}

export interface EventAnalytics {
  totalRevenue: number
  ticketsSold: number
  ticketsRemaining: number
  averageOrderValue: number
  checkInRate: number
  salesByType: Array<{
    name: string
    sold: number
    remaining: number
    revenue: number
    price: number
  }>
  salesOverTime: Array<{ date: string; tickets: number; revenue: number }>
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

export async function getOrganizerStats(organizerId: string): Promise<OrganizerStats> {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, status, start_at')
    .eq('organizer_id', organizerId) as { data: Array<{ id: string; status: string; start_at: string }> | null }

  const allEvents    = events ?? []
  const published    = allEvents.filter((e) => e.status === 'published')
  const upcoming     = allEvents.filter((e) => e.status === 'published' && new Date(e.start_at) > new Date())
  const eventIds     = allEvents.map((e) => e.id)

  if (eventIds.length === 0) {
    return { totalEvents: 0, publishedEvents: 0, totalTicketsSold: 0, totalRevenue: 0, upcomingEvents: 0 }
  }

  // Aggregate revenue from paid orders
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, status')
    .in('event_id', eventIds)
    .eq('status', 'paid') as { data: Array<{ total_amount: number; status: string }> | null }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: false })
    .in('event_id', eventIds)
    .neq('status', 'cancelled') as { data: unknown[] | null }

  return {
    totalEvents:      allEvents.length,
    publishedEvents:  published.length,
    totalTicketsSold: tickets?.length ?? 0,
    totalRevenue:     (orders ?? []).reduce((s, o) => s + o.total_amount, 0),
    upcomingEvents:   upcoming.length,
  }
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export async function getOrganizerEvents(
  organizerId: string,
  page = 1,
  status?: EventStatus,
): Promise<PaginatedResult<EventFull>> {
  const supabase = await createClient()

  let q = supabase
    .from('events')
    .select(
      `*, category:event_categories(id,name,slug,description,image_url,created_at,updated_at),
       organizer:profiles(id,full_name,avatar_url,role,created_at,updated_at),
       ticket_types(*)`,
      { count: 'exact' },
    )
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)

  const from = (page - 1) * PAGE_SIZE
  q = q.range(from, from + PAGE_SIZE - 1)

  const { data, count, error } = await q
  if (error) { console.error('[organizer] getOrganizerEvents:', error.message); return { data: [], count: 0, page, pageSize: PAGE_SIZE, totalPages: 0 } }

  return {
    data: (data ?? []) as unknown as EventFull[],
    count: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

export async function getOrganizerEventById(
  eventId: string,
  organizerId: string,
): Promise<EventFull | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(id,name,slug,description,image_url,created_at,updated_at),
      organizer:profiles(id,full_name,avatar_url,role,created_at,updated_at),
      ticket_types(*)
    `)
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .single()

  if (error) return null
  return data as unknown as EventFull
}

export interface CreateEventInput {
  title: string
  description: string
  category_id: string
  venue_name: string
  venue_address: string
  city: string
  country: string
  start_at: string
  end_at: string
  capacity: number | null
  image_url?: string | null
}

export async function createEvent(
  input: CreateEventInput,
  organizerId: string,
): Promise<{ id: string; slug: string } | null> {
  const service = createServiceClient()
  const slug    = slugify(input.title) + '-' + Date.now().toString(36)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('events')
    .insert({
      ...input,
      organizer_id: organizerId,
      slug,
      status: 'draft',
    })
    .select('id, slug')
    .single() as { data: { id: string; slug: string } | null; error: { message: string } | null }

  if (error) { console.error('[organizer] createEvent:', error.message); return null }
  return data
}

export async function updateEvent(
  eventId: string,
  organizerId: string,
  updates: Partial<CreateEventInput> & { status?: EventStatus },
): Promise<boolean> {
  const supabase = await createClient()

  // If title changed, regenerate slug
  const extra: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.title) {
    extra['slug'] = slugify(updates.title) + '-' + Date.now().toString(36)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('events')
    .update({ ...updates, ...extra })
    .eq('id', eventId)
    .eq('organizer_id', organizerId)  // security: cannot modify another organizer's event

  return !error
}

export async function deleteEvent(eventId: string, organizerId: string): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .eq('status', 'draft')  // only drafts can be deleted

  return !error
}

// ─── TICKET TYPES ─────────────────────────────────────────────────────────────

export interface CreateTicketTypeInput {
  name: string
  description?: string | null
  price: number
  currency: string
  quantity: number
  sales_start_at?: string | null
  sales_end_at?: string | null
}

export async function createTicketType(
  eventId: string,
  organizerId: string,
  input: CreateTicketTypeInput,
): Promise<TicketType | null> {
  const service = createServiceClient()

  // Verify event ownership first
  const owns = await verifyEventOwnership(eventId, organizerId)
  if (!owns) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('ticket_types')
    .insert({ ...input, event_id: eventId, currency: input.currency.toUpperCase() })
    .select('*')
    .single() as { data: TicketType | null; error: { message: string } | null }

  if (error) { console.error('[organizer] createTicketType:', error.message); return null }
  return data
}

export async function updateTicketType(
  ticketTypeId: string,
  organizerId: string,
  updates: Partial<CreateTicketTypeInput> & { status?: TicketTypeStatus },
): Promise<boolean> {
  const supabase = await createClient()

  // Verify ownership via event join
  const { data: tt } = await supabase
    .from('ticket_types')
    .select('id, event_id')
    .eq('id', ticketTypeId)
    .single<{ id: string; event_id: string }>()

  if (!tt) return false
  const owns = await verifyEventOwnership(tt.event_id, organizerId)
  if (!owns) return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ticket_types')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ticketTypeId)

  return !error
}

export async function deleteTicketType(
  ticketTypeId: string,
  organizerId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: tt } = await supabase
    .from('ticket_types')
    .select('id, event_id, sold_quantity')
    .eq('id', ticketTypeId)
    .single<{ id: string; event_id: string; sold_quantity: number }>()

  if (!tt) return { success: false, error: 'Ticket type not found.' }
  if (tt.sold_quantity > 0) return { success: false, error: 'Cannot delete a ticket type that has sales.' }

  const owns = await verifyEventOwnership(tt.event_id, organizerId)
  if (!owns) return { success: false, error: 'Unauthorized.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ticket_types')
    .delete()
    .eq('id', ticketTypeId)

  return error ? { success: false, error: error.message } : { success: true }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function getEventOrders(
  eventId: string,
  organizerId: string,
  page = 1,
): Promise<PaginatedResult<Order & {
  buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  item_count: number
}>> {
  const owns = await verifyEventOwnership(eventId, organizerId)
  if (!owns) return { data: [], count: 0, page, pageSize: PAGE_SIZE, totalPages: 0 }

  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE

  const { data, count, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles(id, full_name, avatar_url),
      order_items(id)
    `, { count: 'exact' })
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (error) return { data: [], count: 0, page, pageSize: PAGE_SIZE, totalPages: 0 }

  type RawOrder = {
    buyer: { id: string; full_name: string | null; avatar_url: string | null }
    order_items: Array<{ id: string }>
    [key: string]: unknown
  }

  const mapped = ((data ?? []) as unknown as RawOrder[]).map((o) => ({
    ...o,
    buyer:      o.buyer,
    item_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
  })) as unknown as Array<Order & { buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>; item_count: number }>

  return {
    data:       mapped,
    count:      count ?? 0,
    page,
    pageSize:   PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

// ─── ATTENDEES ────────────────────────────────────────────────────────────────

export async function getEventAttendees(
  eventId: string,
  organizerId: string,
  search = '',
): Promise<AttendeeRow[]> {
  const owns = await verifyEventOwnership(eventId, organizerId)
  if (!owns) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id, ticket_code, user_id, status, checked_in_at, created_at,
      ticket_type:ticket_types(name),
      order:orders(status),
      attendee:profiles(full_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (error) return []

  type RawRow = {
    id: string; ticket_code: string; user_id: string
    status: string; checked_in_at: string | null; created_at: string
    ticket_type: { name: string }
    order: { status: string }
    attendee: { full_name: string | null; avatar_url: string | null }
  }

  let rows = (data ?? []) as unknown as RawRow[]

  if (search.trim()) {
    const q = search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.attendee?.full_name?.toLowerCase().includes(q) ||
        r.ticket_code.toLowerCase().includes(q),
    )
  }

  return rows.map((r) => ({
    ticket_id:        r.id,
    ticket_code:      r.ticket_code,
    user_id:          r.user_id,
    full_name:        r.attendee?.full_name ?? null,
    avatar_url:       r.attendee?.avatar_url ?? null,
    ticket_type_name: r.ticket_type?.name ?? '',
    order_status:     (r.order?.status ?? 'paid') as OrderStatus,
    checked_in:       r.status === 'used',
    checked_in_at:    r.checked_in_at,
    purchased_at:     r.created_at,
  }))
}

// ─── CHECK-INS ────────────────────────────────────────────────────────────────

export interface CheckInSummary {
  total: number
  checkedIn: number
  remaining: number
  rate: number
  recent: CheckInRow[]
}

export async function getCheckInSummary(
  eventId: string,
  organizerId: string,
): Promise<CheckInSummary> {
  const owns = await verifyEventOwnership(eventId, organizerId)
  if (!owns) return { total: 0, checkedIn: 0, remaining: 0, rate: 0, recent: [] }

  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('event_id', eventId)
    .neq('status', 'cancelled') as { data: Array<{ id: string; status: string }> | null }

  const all      = tickets ?? []
  const total    = all.length
  const checkedIn = all.filter((t) => t.status === 'used').length

  const { data: recent } = await supabase
    .from('check_ins')
    .select(`
      id, checked_in_at,
      ticket:tickets(ticket_code, ticket_type:ticket_types(name)),
      attendee:profiles!check_ins_checked_in_by_fkey(full_name),
      ticket_attendee:tickets(attendee:profiles(full_name))
    `)
    .eq('event_id', eventId)
    .order('checked_in_at', { ascending: false })
    .limit(20)

  type RawCheckin = {
    id: string; checked_in_at: string
    ticket: { ticket_code: string; ticket_type: { name: string } }
    attendee: { full_name: string | null }
    ticket_attendee: { attendee: { full_name: string | null } }
  }

  const recentRows: CheckInRow[] = ((recent ?? []) as unknown as RawCheckin[]).map((r) => ({
    id:                r.id,
    ticket_id:         '',
    ticket_code:       r.ticket?.ticket_code ?? '',
    attendee_name:     r.ticket_attendee?.attendee?.full_name ?? null,
    ticket_type_name:  r.ticket?.ticket_type?.name ?? '',
    checked_in_at:     r.checked_in_at,
    checked_in_by_name: r.attendee?.full_name ?? null,
  }))

  return {
    total,
    checkedIn,
    remaining: total - checkedIn,
    rate:      total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    recent:    recentRows,
  }
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function getEventAnalytics(
  eventId: string,
  organizerId: string,
): Promise<EventAnalytics> {
  const owns = await verifyEventOwnership(eventId, organizerId)
  if (!owns) return { totalRevenue: 0, ticketsSold: 0, ticketsRemaining: 0, averageOrderValue: 0, checkInRate: 0, salesByType: [], salesOverTime: [] }

  const supabase = await createClient()

  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name, price, quantity, sold_quantity, currency')
    .eq('event_id', eventId) as {
      data: Array<{ id: string; name: string; price: number; quantity: number; sold_quantity: number; currency: string }> | null
    }

  const tts = ticketTypes ?? []

  const totalRevenue    = tts.reduce((s, t) => s + t.price * t.sold_quantity, 0)
  const ticketsSold     = tts.reduce((s, t) => s + t.sold_quantity, 0)
  const ticketsRemaining = tts.reduce((s, t) => s + (t.quantity - t.sold_quantity), 0)

  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('event_id', eventId)
    .eq('status', 'paid')
    .order('created_at', { ascending: true }) as {
      data: Array<{ total_amount: number; created_at: string }> | null
    }

  const orders            = paidOrders ?? []
  const averageOrderValue = orders.length > 0
    ? Math.round(orders.reduce((s, o) => s + o.total_amount, 0) / orders.length)
    : 0

  const { data: tickets } = await supabase
    .from('tickets')
    .select('status')
    .eq('event_id', eventId)
    .neq('status', 'cancelled') as { data: Array<{ status: string }> | null }

  const allTickets  = tickets ?? []
  const usedCount   = allTickets.filter((t) => t.status === 'used').length
  const checkInRate = allTickets.length > 0 ? Math.round((usedCount / allTickets.length) * 100) : 0

  // Sales over time — group paid orders by date
  const salesMap = new Map<string, { tickets: number; revenue: number }>()
  for (const o of orders) {
    const date = o.created_at.slice(0, 10)
    const existing = salesMap.get(date) ?? { tickets: 0, revenue: 0 }
    salesMap.set(date, {
      tickets: existing.tickets + 1,
      revenue: existing.revenue + o.total_amount,
    })
  }
  const salesOverTime = Array.from(salesMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalRevenue,
    ticketsSold,
    ticketsRemaining,
    averageOrderValue,
    checkInRate,
    salesByType: tts.map((t) => ({
      name:      t.name,
      sold:      t.sold_quantity,
      remaining: t.quantity - t.sold_quantity,
      revenue:   t.price * t.sold_quantity,
      price:     t.price,
    })),
    salesOverTime,
  }
}

// ─── ORGANIZER OVERVIEW ───────────────────────────────────────────────────────

export async function getRecentOrdersForOrganizer(
  organizerId: string,
  limit = 8,
) {
  const supabase = await createClient()

  const { data: eventIds } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', organizerId) as { data: Array<{ id: string }> | null }

  const ids = (eventIds ?? []).map((e) => e.id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, currency, created_at,
      event:events(id, title, slug),
      buyer:profiles(id, full_name, avatar_url)
    `)
    .in('event_id', ids)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as Array<{
    id: string; status: string; total_amount: number; currency: string; created_at: string
    event: { id: string; title: string; slug: string }
    buyer: { id: string; full_name: string | null; avatar_url: string | null }
  }>
}

// ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

async function verifyEventOwnership(eventId: string, organizerId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .single<{ id: string }>()
  return !!data
}
