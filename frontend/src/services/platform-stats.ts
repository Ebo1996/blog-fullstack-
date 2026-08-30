/**
 * Public platform statistics — no auth required.
 * Uses the service client so it works on public pages like Home and About.
 * Counts are real data from the database.
 */

import { createServiceClient } from '@/lib/supabase/service'

export interface PublicPlatformStats {
  totalTicketsSold: number
  totalEvents: number
  totalOrganizers: number
  // Formatted strings ready for display
  ticketsSoldDisplay: string
  eventsDisplay: string
  organizersDisplay: string
}

let cached: { data: PublicPlatformStats; at: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  // Return cached value if fresh
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data

  try {
    const service = createServiceClient()

    const [
      { count: tickets },
      { count: events },
      { count: organizers },
    ] = await Promise.all([
      service.from('tickets').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
      service.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      service.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'organizer'),
    ])

    const totalTicketsSold = tickets ?? 0
    const totalEvents      = events ?? 0
    const totalOrganizers  = organizers ?? 0

    const data: PublicPlatformStats = {
      totalTicketsSold,
      totalEvents,
      totalOrganizers,
      ticketsSoldDisplay: totalTicketsSold > 1000
        ? `${(totalTicketsSold / 1000).toFixed(1).replace('.0', '')}K+`
        : totalTicketsSold > 0 ? `${totalTicketsSold}+` : '0',
      eventsDisplay: totalEvents > 0 ? `${totalEvents}+` : '0',
      organizersDisplay: totalOrganizers > 0 ? `${totalOrganizers}+` : '0',
    }

    cached = { data, at: Date.now() }
    return data
  } catch {
    // Fail gracefully — return sensible fallback values
    return {
      totalTicketsSold: 0,
      totalEvents: 0,
      totalOrganizers: 0,
      ticketsSoldDisplay: '—',
      eventsDisplay: '—',
      organizersDisplay: '—',
    }
  }
}
