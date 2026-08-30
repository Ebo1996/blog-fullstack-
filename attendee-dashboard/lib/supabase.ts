import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Single shared browser client for the attendee-dashboard app
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// ─── Types matching the backend schema ────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

export interface TicketWithEvent {
  id: string
  ticket_code: string
  status: string
  qr_token: string
  created_at: string
  event: {
    id: string
    title: string
    slug: string
    start_at: string
    end_at: string
    venue_name: string | null
    venue_address: string | null
    city: string | null
    category: { name: string; slug: string } | null
  }
  ticket_type: {
    id: string
    name: string
    price: number
    currency: string
  }
}

export interface OrderWithEvent {
  id: string
  status: string
  subtotal: number
  fees: number
  total_amount: number
  currency: string
  created_at: string
  event: {
    id: string
    title: string
    slug: string
    start_at: string
  }
}

export interface RSVPWithEvent {
  id: string
  status: string
  created_at: string
  event: {
    id: string
    title: string
    slug: string
    start_at: string
    end_at: string
    venue_name: string | null
    city: string | null
    category: { name: string; slug: string } | null
  }
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

export interface Transfer {
  id: string
  status: string
  created_at: string
  ticket: {
    id: string
    ticket_code: string
    event: { id: string; title: string; start_at: string; venue_name: string | null }
  }
  from_user: { id: string; full_name: string | null }
  to_user: { id: string; full_name: string | null }
}
