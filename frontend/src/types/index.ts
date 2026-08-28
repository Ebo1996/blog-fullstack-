// Re-export all types from a single entry point
export * from './database'

// ─── API RESPONSE TYPES ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ─── FILTER TYPES ─────────────────────────────────────────────────────────────

export interface EventFilters {
  search?: string
  category?: string
  city?: string
  country?: string
  dateFrom?: string
  dateTo?: string
  priceMin?: number
  priceMax?: number
  status?: string
  sort?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'popular'
}

export interface OrderFilters {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface UserFilters {
  search?: string
  role?: string
}

// ─── CHECKOUT TYPES ───────────────────────────────────────────────────────────

export interface CheckoutItem {
  ticketTypeId: string
  quantity: number
}

export interface CheckoutSession {
  url: string
  sessionId: string
  orderId: string
}

// ─── TICKET VALIDATION ────────────────────────────────────────────────────────

export type ScanResult =
  | 'valid'
  | 'already_checked_in'
  | 'wrong_event'
  | 'invalid'
  | 'cancelled'
  | 'expired'
  | 'transferred'

export interface ScanResponse {
  success: boolean
  status: ScanResult
  ticketId?: string
  attendeeName?: string
  ticketType?: string
  checkedInAt?: string
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export interface EventAnalytics {
  totalRevenue: number
  ticketsSold: number
  ticketsRemaining: number
  averageOrderValue: number
  checkInRate: number
  salesByTicketType: Array<{
    ticketTypeName: string
    sold: number
    remaining: number
    revenue: number
  }>
  salesOverTime: Array<{ date: string; tickets: number; revenue: number }>
}

export interface PlatformAnalytics {
  totalUsers: number
  totalOrganizers: number
  totalEvents: number
  publishedEvents: number
  totalTicketsSold: number
  grossRevenue: number
  totalRefunds: number
  userGrowth: Array<{ date: string; users: number }>
  revenueOverTime: Array<{ date: string; revenue: number }>
}

// ─── FORM TYPES ───────────────────────────────────────────────────────────────

export interface CreateEventFormData {
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
  image_url?: string
}

export interface CreateTicketTypeFormData {
  name: string
  description?: string
  price: number
  currency: string
  quantity: number
  sales_start_at?: string
  sales_end_at?: string
}

export interface RegisterFormData {
  full_name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ProfileUpdateFormData {
  full_name: string
  avatar_url?: string
}
