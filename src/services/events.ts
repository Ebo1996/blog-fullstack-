import { createClient } from '@/lib/supabase/server'
import type { EventFull, EventWithCategory, PaginatedResult } from '@/types'
import type { EventFilters } from '@/types'

const PAGE_SIZE = 12

// ─── PUBLIC QUERIES ───────────────────────────────────────────────────────────

export async function getPublishedEvents(
  filters: EventFilters = {},
  page = 1,
): Promise<PaginatedResult<EventWithCategory>> {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(
      `*, category:event_categories(id,name,slug,description,image_url,created_at,updated_at)`,
      { count: 'exact' },
    )
    .eq('status', 'published')

  // Search
  if (filters.search?.trim()) {
    query = query.or(
      `title.ilike.%${filters.search.trim()}%,description.ilike.%${filters.search.trim()}%,city.ilike.%${filters.search.trim()}%`,
    )
  }

  // Category filter (by slug)
  if (filters.category) {
    const { data: cat } = await supabase
      .from('event_categories')
      .select('id')
      .eq('slug', filters.category)
      .single<{ id: string }>()
    if (cat) query = query.eq('category_id', cat.id)
  }

  // City
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`)
  }

  // Date range
  if (filters.dateFrom) {
    query = query.gte('start_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('start_at', filters.dateTo)
  }

  // Sorting
  switch (filters.sort) {
    case 'date_asc':
      query = query.order('start_at', { ascending: true })
      break
    case 'date_desc':
      query = query.order('start_at', { ascending: false })
      break
    default:
      // Default: upcoming first
      query = query
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
  }

  // Pagination
  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[events] getPublishedEvents:', error.message)
    return { data: [], count: 0, page, pageSize: PAGE_SIZE, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    data: (data ?? []) as unknown as EventWithCategory[],
    count: total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }
}

export async function getFeaturedEvents(limit = 4): Promise<EventWithCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `*, category:event_categories(id,name,slug,description,image_url,created_at,updated_at)`,
    )
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[events] getFeaturedEvents:', error.message)
    return []
  }
  return (data ?? []) as unknown as EventWithCategory[]
}

export async function getUpcomingEvents(limit = 8): Promise<EventWithCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `*, category:event_categories(id,name,slug,description,image_url,created_at,updated_at)`,
    )
    .eq('status', 'published')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[events] getUpcomingEvents:', error.message)
    return []
  }
  return (data ?? []) as unknown as EventWithCategory[]
}

export async function getEventBySlug(slug: string): Promise<EventFull | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `*,
       category:event_categories(id,name,slug,description,image_url,created_at,updated_at),
       organizer:profiles(id,full_name,avatar_url,role,created_at,updated_at),
       ticket_types(*)`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) return null
  return data as unknown as EventFull
}

export async function getEventsByCategory(
  categorySlug: string,
  page = 1,
): Promise<PaginatedResult<EventWithCategory>> {
  return getPublishedEvents({ category: categorySlug }, page)
}

export async function getEventCities(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('city')
    .eq('status', 'published')
    .not('city', 'is', null)

  if (error) return []
  const rows = (data ?? []) as Array<{ city: string | null }>
  const cities = [...new Set(rows.map((r) => r.city).filter(Boolean))] as string[]
  return cities.sort()
}

// ─── MIN PRICE HELPER ────────────────────────────────────────────────────────

export async function getEventMinPrice(eventId: string): Promise<number | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ticket_types')
    .select('price')
    .eq('event_id', eventId)
    .neq('status', 'inactive')
    .order('price', { ascending: true })
    .limit(1)
    .single<{ price: number }>()

  if (error || !data) return null
  return data.price
}
