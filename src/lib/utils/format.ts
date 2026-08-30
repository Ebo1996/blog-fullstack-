import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns'

// ─── CURRENCY ─────────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100) // amounts stored in cents
}

export function formatCurrencyCompact(amount: number, currency = 'USD'): string {
  const dollars = amount / 100
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}K`
  }
  return formatCurrency(amount, currency)
}

// ─── DATES ────────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy · h:mm a')
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d')
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  if (format(s, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd')) {
    return `${format(s, 'MMM d, yyyy')} · ${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`
  }
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function isUpcoming(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isAfter(d, new Date())
}

export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isBefore(d, new Date())
}

export function getDayOfMonth(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd')
}

export function getMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM\nyyyy')
}

// ─── NUMBERS ──────────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

// ─── STRINGS ─────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── TICKET CODES ─────────────────────────────────────────────────────────────

export function formatTicketCode(code: string): string {
  // Format: NS-XXXX-XXXX → NS-XXXX-XXXX (already formatted)
  return code.toUpperCase()
}

// ─── ORDER IDs ────────────────────────────────────────────────────────────────

export function formatOrderId(id: string): string {
  // Show first 8 chars of UUID prefixed
  return `#${id.slice(0, 8).toUpperCase()}`
}
