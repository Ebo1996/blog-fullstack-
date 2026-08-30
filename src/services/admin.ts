/**
 * Admin service layer — all queries require admin role.
 * Uses the service-role client for operations that cross user boundaries
 * (e.g. suspending users, listing all orders).
 * Every function verifies the caller is an admin before executing.
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserRole, EventStatus, OrderStatus, EventCategory } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number
  totalOrganizers: number
  totalEvents: number
  publishedEvents: number
  totalTicketsSold: number
  grossRevenue: number
  totalRefunds: number
  activeEvents: number
  newUsersThisWeek: number
  newEventsThisWeek: number
}

export interface AdminUserRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  email: string | null
  created_at: string
  suspended: boolean
}

export interface AdminEventRow {
  id: string
  title: string
  slug: string
  status: EventStatus
  organizer_id: string
  organizer_name: string | null
  city: string | null
  start_at: string
  tickets_sold: number
  revenue: number
  created_at: string
}

export interface AdminOrderRow {
  id: string
  user_id: string
  buyer_name: string | null
  event_id: string
  event_title: string
  status: OrderStatus
  total_amount: number
  currency: string
  created_at: string
}

export interface AdminReport {
  id: string
  reporter_id: string
  reporter_name: string | null
  target_type: 'event' | 'user' | 'organizer'
  target_id: string
  target_name: string | null
  reason: string
  status: 'pending' | 'dismissed' | 'actioned'
  created_at: string
}

export interface PlatformAnalytics {
  userGrowth: Array<{ date: string; users: number; organizers: number }>
  revenueOverTime: Array<{ date: string; revenue: number; orders: number }>
  eventsByStatus: Array<{ status: string; count: number }>
  ticketsByType: Array<{ name: string; count: number }>
}

const PAGE = 20

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  return profile?.role === 'admin' ? user.id : null
}

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
  const adminId = await requireAdmin()
  if (!adminId) return {
    totalUsers: 0, totalOrganizers: 0, totalEvents: 0, publishedEvents: 0,
    totalTicketsSold: 0, grossRevenue: 0, totalRefunds: 0, activeEvents: 0,
    newUsersThisWeek: 0, newEventsThisWeek: 0,
  }

  const service = createServiceClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const [
    { count: totalUsers },
    { count: totalOrganizers },
    { count: totalEvents },
    { count: publishedEvents },
    { count: activeEvents },
    { count: totalTicketsSold },
    { count: newUsersThisWeek },
    { count: newEventsThisWeek },
    { data: revenueData },
    { data: refundData },
  ] = await Promise.all([
    service.from('profiles').select('id', { count: 'exact', head: true }),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'organizer'),
    service.from('events').select('id', { count: 'exact', head: true }),
    service.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    service.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('start_at', now),
    service.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
    service.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    service.from('events').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    service.from('orders').select('total_amount').eq('status', 'paid'),
    service.from('orders').select('total_amount').in('status', ['refunded', 'partially_refunded']),
  ])

  const grossRevenue = ((revenueData ?? []) as Array<{ total_amount: number }>)
    .reduce((s, o) => s + o.total_amount, 0)
  const totalRefunds = ((refundData ?? []) as Array<{ total_amount: number }>)
    .reduce((s, o) => s + o.total_amount, 0)

  return {
    totalUsers:       totalUsers ?? 0,
    totalOrganizers:  totalOrganizers ?? 0,
    totalEvents:      totalEvents ?? 0,
    publishedEvents:  publishedEvents ?? 0,
    activeEvents:     activeEvents ?? 0,
    totalTicketsSold: totalTicketsSold ?? 0,
    grossRevenue,
    totalRefunds,
    newUsersThisWeek:  newUsersThisWeek ?? 0,
    newEventsThisWeek: newEventsThisWeek ?? 0,
  }
}

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

export async function getAdminUsers(
  search = '',
  role?: UserRole,
  page = 1,
): Promise<{ data: AdminUserRow[]; count: number; totalPages: number }> {
  const adminId = await requireAdmin()
  if (!adminId) return { data: [], count: 0, totalPages: 0 }

  const service = createServiceClient()

  // Get all auth users (for email + suspension status)
  const { data: authUsers } = await service.auth.admin.listUsers({ perPage: 1000 })
  const authMap = new Map(
    (authUsers?.users ?? []).map((u) => [
      u.id,
      {
        email:  u.email ?? null,
        // banned_until is set to a future date when banned, null/undefined when active
        banned: u.banned_until != null && new Date(u.banned_until) > new Date(),
      },
    ]),
  )

  let q = service
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (role) q = q.eq('role', role)

  const { data: profiles, count } = await q as {
    data: Array<{ id: string; full_name: string | null; avatar_url: string | null; role: UserRole; created_at: string }> | null
    count: number | null
  }

  let rows: AdminUserRow[] = (profiles ?? []).map((p) => {
    const auth = authMap.get(p.id)
    return {
      id:         p.id,
      full_name:  p.full_name,
      avatar_url: p.avatar_url,
      role:       p.role,
      email:      auth?.email ?? null,
      created_at: p.created_at,
      suspended:  auth?.banned ?? false,
    }
  })

  // Client-side search (by name or email)
  if (search.trim()) {
    const q2 = search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.full_name?.toLowerCase().includes(q2) ||
        r.email?.toLowerCase().includes(q2),
    )
  }

  const total = rows.length
  const from  = (page - 1) * PAGE
  const paged = rows.slice(from, from + PAGE)

  return { data: paged, count: total, totalPages: Math.ceil(total / PAGE) }
}

export async function setUserSuspended(
  targetUserId: string,
  suspend: boolean,
): Promise<boolean> {
  const adminId = await requireAdmin()
  if (!adminId) return false

  const service = createServiceClient()
  if (suspend) {
    const { error } = await service.auth.admin.updateUserById(targetUserId, { ban_duration: '87600h' })
    return !error
  } else {
    const { error } = await service.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' })
    return !error
  }
}

export async function setUserRole(targetUserId: string, newRole: UserRole): Promise<boolean> {
  const adminId = await requireAdmin()
  if (!adminId) return false

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  return !error
}

// ─── EVENT MODERATION ─────────────────────────────────────────────────────────

export async function getAdminEvents(
  search = '',
  status?: EventStatus,
  page = 1,
): Promise<{ data: AdminEventRow[]; count: number; totalPages: number }> {
  const adminId = await requireAdmin()
  if (!adminId) return { data: [], count: 0, totalPages: 0 }

  const service = createServiceClient()
  const from = (page - 1) * PAGE

  let q = service
    .from('events')
    .select(`
      id, title, slug, status, organizer_id, city, start_at, created_at,
      organizer:profiles(full_name),
      ticket_types(price, sold_quantity)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE - 1)

  if (status) q = q.eq('status', status)
  if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)

  const { data, count } = await q

  type RawEvent = {
    id: string; title: string; slug: string; status: EventStatus
    organizer_id: string; city: string | null; start_at: string; created_at: string
    organizer: { full_name: string | null } | null
    ticket_types: Array<{ price: number; sold_quantity: number }>
  }

  const rows: AdminEventRow[] = ((data ?? []) as unknown as RawEvent[]).map((e) => ({
    id:             e.id,
    title:          e.title,
    slug:           e.slug,
    status:         e.status,
    organizer_id:   e.organizer_id,
    organizer_name: e.organizer?.full_name ?? null,
    city:           e.city,
    start_at:       e.start_at,
    tickets_sold:   (e.ticket_types ?? []).reduce((s, t) => s + t.sold_quantity, 0),
    revenue:        (e.ticket_types ?? []).reduce((s, t) => s + t.price * t.sold_quantity, 0),
    created_at:     e.created_at,
  }))

  return { data: rows, count: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE) }
}

export async function adminSetEventStatus(
  eventId: string,
  status: EventStatus,
): Promise<boolean> {
  const adminId = await requireAdmin()
  if (!adminId) return false

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('events')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', eventId)

  return !error
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function getAdminOrders(
  search = '',
  status?: OrderStatus,
  page = 1,
): Promise<{ data: AdminOrderRow[]; count: number; totalPages: number }> {
  const adminId = await requireAdmin()
  if (!adminId) return { data: [], count: 0, totalPages: 0 }

  const service = createServiceClient()
  const from = (page - 1) * PAGE

  let q = service
    .from('orders')
    .select(`
      id, user_id, event_id, status, total_amount, currency, created_at,
      buyer:profiles(full_name),
      event:events(title)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE - 1)

  if (status) q = q.eq('status', status)

  const { data, count } = await q

  type RawOrder = {
    id: string; user_id: string; event_id: string; status: OrderStatus
    total_amount: number; currency: string; created_at: string
    buyer: { full_name: string | null } | null
    event: { title: string } | null
  }

  let rows: AdminOrderRow[] = ((data ?? []) as unknown as RawOrder[]).map((o) => ({
    id:           o.id,
    user_id:      o.user_id,
    buyer_name:   o.buyer?.full_name ?? null,
    event_id:     o.event_id,
    event_title:  o.event?.title ?? '',
    status:       o.status,
    total_amount: o.total_amount,
    currency:     o.currency,
    created_at:   o.created_at,
  }))

  if (search.trim()) {
    const q2 = search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.buyer_name?.toLowerCase().includes(q2) ||
        r.event_title.toLowerCase().includes(q2) ||
        r.id.toLowerCase().includes(q2),
    )
  }

  return { data: rows, count: count ?? 0, totalPages: Math.ceil((count ?? 0) / PAGE) }
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function adminCreateCategory(input: {
  name: string; slug: string; description?: string | null
}): Promise<EventCategory | null> {
  const adminId = await requireAdmin()
  if (!adminId) return null

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('event_categories')
    .insert(input)
    .select('*')
    .single() as { data: EventCategory | null; error: { message: string } | null }

  if (error) { console.error('[admin] createCategory:', error.message); return null }
  return data
}

export async function adminUpdateCategory(
  id: string,
  updates: Partial<{ name: string; slug: string; description: string | null }>,
): Promise<boolean> {
  const adminId = await requireAdmin()
  if (!adminId) return false

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('event_categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  return !error
}

export async function adminDeleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const adminId = await requireAdmin()
  if (!adminId) return { success: false, error: 'Unauthorized' }

  // Check no events use this category
  const service = createServiceClient()
  const { count } = await service
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if ((count ?? 0) > 0) {
    return { success: false, error: `Cannot delete — ${count} event${count !== 1 ? 's use' : ' uses'} this category.` }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('event_categories')
    .delete()
    .eq('id', id)

  return error ? { success: false, error: error.message } : { success: true }
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export async function getAdminReports(
  status?: 'pending' | 'dismissed' | 'actioned',
): Promise<AdminReport[]> {
  const adminId = await requireAdmin()
  if (!adminId) return []

  // Reports table might not exist yet — return empty gracefully
  const service = createServiceClient()
  let q = service
    .from('reports' as 'events') // cast to avoid type error on missing table
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return []
  return (data ?? []) as unknown as AdminReport[]
}

export async function dismissReport(reportId: string): Promise<boolean> {
  const adminId = await requireAdmin()
  if (!adminId) return false

  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('reports')
    .update({ status: 'dismissed' })
    .eq('id', reportId)

  return !error
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const adminId = await requireAdmin()
  if (!adminId) return { userGrowth: [], revenueOverTime: [], eventsByStatus: [], ticketsByType: [] }

  const service = createServiceClient()

  const [profilesResult, ordersResult, eventsResult] = await Promise.all([
    service.from('profiles').select('role, created_at').order('created_at', { ascending: true }),
    service.from('orders').select('total_amount, status, created_at').eq('status', 'paid').order('created_at', { ascending: true }),
    service.from('events').select('status'),
  ])

  const profiles = (profilesResult.data ?? []) as Array<{ role: string; created_at: string }>
  const orders   = (ordersResult.data ?? [])   as Array<{ total_amount: number; status: string; created_at: string }>
  const events   = (eventsResult.data ?? [])   as Array<{ status: string }>

  // User growth — group by month
  const userByMonth = new Map<string, { users: number; organizers: number }>()
  for (const p of profiles ?? []) {
    const month = p.created_at.slice(0, 7)
    const existing = userByMonth.get(month) ?? { users: 0, organizers: 0 }
    userByMonth.set(month, {
      users:      existing.users + 1,
      organizers: existing.organizers + (p.role === 'organizer' ? 1 : 0),
    })
  }
  const userGrowth = Array.from(userByMonth.entries())
    .map(([date, v]) => ({ date, ...v }))
    .slice(-12) // last 12 months

  // Revenue over time — group by month
  const revByMonth = new Map<string, { revenue: number; orders: number }>()
  for (const o of orders ?? []) {
    const month = o.created_at.slice(0, 7)
    const existing = revByMonth.get(month) ?? { revenue: 0, orders: 0 }
    revByMonth.set(month, {
      revenue: existing.revenue + o.total_amount,
      orders:  existing.orders + 1,
    })
  }
  const revenueOverTime = Array.from(revByMonth.entries())
    .map(([date, v]) => ({ date, ...v }))
    .slice(-12)

  // Events by status
  const statusCounts = new Map<string, number>()
  for (const e of events ?? []) {
    statusCounts.set(e.status, (statusCounts.get(e.status) ?? 0) + 1)
  }
  const eventsByStatus = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))

  return { userGrowth, revenueOverTime, eventsByStatus, ticketsByType: [] }
}

// ─── RECENT PLATFORM ACTIVITY ─────────────────────────────────────────────────

export async function getRecentPlatformOrders(limit = 10) {
  const adminId = await requireAdmin()
  if (!adminId) return []

  const service = createServiceClient()
  const { data } = await service
    .from('orders')
    .select(`
      id, status, total_amount, currency, created_at,
      buyer:profiles(full_name, avatar_url),
      event:events(id, title)
    `)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as Array<{
    id: string; status: string; total_amount: number; currency: string; created_at: string
    buyer: { full_name: string | null; avatar_url: string | null }
    event: { id: string; title: string }
  }>
}
