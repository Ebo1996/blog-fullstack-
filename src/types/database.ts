// ─────────────────────────────────────────────────────────────────────────────
// DATABASE TYPES — auto-derived from the Supabase schema
// Keep in sync with supabase/migrations/
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'attendee' | 'organizer' | 'admin'

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export type TicketTypeStatus = 'active' | 'inactive' | 'sold_out'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export type TicketStatus = 'active' | 'used' | 'cancelled' | 'transferred' | 'expired'

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlisted'

export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'

export type NotificationType =
  | 'ticket_purchased'
  | 'payment_completed'
  | 'payment_failed'
  | 'event_reminder'
  | 'ticket_transfer_received'
  | 'ticket_transfer_accepted'
  | 'ticket_transfer_rejected'
  | 'ticket_transfer_cancelled'
  | 'event_updated'
  | 'event_cancelled'
  | 'rsvp_confirmed'
  | 'rsvp_waitlisted'
  | 'waitlist_joined'
  | 'waitlist_available'

// ─── TABLE TYPES ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface EventCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  organizer_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  image_url: string | null
  venue_name: string | null
  venue_address: string | null
  city: string | null
  country: string | null
  start_at: string
  end_at: string
  capacity: number | null
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  currency: string
  quantity: number
  sold_quantity: number
  sales_start_at: string | null
  sales_end_at: string | null
  status: TicketTypeStatus
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  event_id: string
  payment_tx_ref: string | null
  payment_reference: string | null
  status: OrderStatus
  subtotal: number
  fees: number
  total_amount: number
  currency: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  ticket_type_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface Ticket {
  id: string
  order_id: string
  event_id: string
  ticket_type_id: string
  user_id: string
  ticket_code: string
  qr_token: string
  status: TicketStatus
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  status: RegistrationStatus
  created_at: string
  updated_at: string
}

export interface TicketTransfer {
  id: string
  ticket_id: string
  from_user_id: string
  to_user_id: string
  status: TransferStatus
  created_at: string
  accepted_at: string | null
  expires_at: string
}

export interface CheckIn {
  id: string
  ticket_id: string
  event_id: string
  checked_in_by: string
  checked_in_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

// ─── JOINED / ENRICHED TYPES ─────────────────────────────────────────────────

export interface EventWithCategory extends Event {
  category: EventCategory | null
}

export interface EventWithOrganizer extends Event {
  organizer: Profile | null
}

export interface EventFull extends Event {
  category: EventCategory | null
  organizer: Profile | null
  ticket_types: TicketType[]
}

export interface TicketWithDetails extends Ticket {
  event: Pick<Event, 'id' | 'title' | 'slug' | 'start_at' | 'end_at' | 'venue_name' | 'venue_address' | 'city' | 'image_url'>
  ticket_type: Pick<TicketType, 'id' | 'name' | 'price' | 'currency'>
}

export interface OrderWithItems extends Order {
  order_items: Array<OrderItem & { ticket_type: Pick<TicketType, 'id' | 'name' | 'price'> }>
  event: Pick<Event, 'id' | 'title' | 'slug' | 'start_at' | 'image_url'>
}

export interface TransferWithDetails extends TicketTransfer {
  ticket: Pick<Ticket, 'id' | 'ticket_code'> & {
    event: Pick<Event, 'id' | 'title' | 'start_at' | 'venue_name'>
  }
  from_user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  to_user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

// ─── SUPABASE DATABASE SCHEMA TYPE ───────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      event_categories: {
        Row: EventCategory
        Insert: Omit<EventCategory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventCategory, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      ticket_types: {
        Row: TicketType
        Insert: Omit<TicketType, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TicketType, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: never
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Ticket, 'id' | 'created_at'>>
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Registration, 'id' | 'created_at'>>
      }
      ticket_transfers: {
        Row: TicketTransfer
        Insert: Omit<TicketTransfer, 'id' | 'created_at'>
        Update: Partial<Omit<TicketTransfer, 'id' | 'created_at'>>
      }
      check_ins: {
        Row: CheckIn
        Insert: Omit<CheckIn, 'id' | 'checked_in_at'>
        Update: never
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Pick<Notification, 'read_at'>>
      }
    }
    Functions: {
      purchase_tickets: {
        Args: {
          p_order_id: string
          p_items: Array<{ ticket_type_id: string; quantity: number; unit_price: number }>
        }
        Returns: { success: boolean; error?: string }
      }
      validate_and_checkin: {
        Args: { p_qr_token: string; p_event_id: string; p_checked_in_by: string }
        Returns: {
          success: boolean
          status: 'valid' | 'already_checked_in' | 'wrong_event' | 'invalid' | 'cancelled' | 'expired' | 'transferred'
          ticket_id?: string
          attendee_name?: string
          ticket_type?: string
          checked_in_at?: string
        }
      }
      transfer_ticket: {
        Args: { p_ticket_id: string; p_from_user_id: string; p_to_user_id: string }
        Returns: { success: boolean; transfer_id?: string; error?: string }
      }
    }
  }
}
