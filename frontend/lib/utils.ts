import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  try { return format(new Date(date), fmt) } catch { return String(date) }
}

export function formatDateTime(date: string | Date) {
  try { return format(new Date(date), "MMM d, yyyy · h:mm a") } catch { return String(date) }
}

export function formatTime(date: string | Date) {
  try { return format(new Date(date), 'h:mm a') } catch { return '' }
}

export function timeAgo(date: string | Date) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) } catch { return '' }
}

export function formatCurrency(amount: number, currency = 'ETB') {
  return `${currency} ${(amount || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getEventStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    published: { label: 'Published', cls: 'badge-success' },
    draft: { label: 'Draft', cls: 'badge-neutral' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger' },
    completed: { label: 'Completed', cls: 'badge-info' },
  }
  return map[status] ?? { label: status, cls: 'badge-neutral' }
}

export function getTicketStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'badge-success' },
    used: { label: 'Used', cls: 'badge-neutral' },
    cancelled: { label: 'Cancelled', cls: 'badge-danger' },
    transferred: { label: 'Transferred', cls: 'badge-info' },
    expired: { label: 'Expired', cls: 'badge-warning' },
  }
  return map[status] ?? { label: status, cls: 'badge-neutral' }
}

export function getOrderStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Paid', cls: 'badge-success' },
    pending: { label: 'Pending', cls: 'badge-warning' },
    failed: { label: 'Failed', cls: 'badge-danger' },
    cancelled: { label: 'Cancelled', cls: 'badge-neutral' },
    refunded: { label: 'Refunded', cls: 'badge-info' },
  }
  return map[status] ?? { label: status, cls: 'badge-neutral' }
}

export function getEventColorClass(index: number) {
  const colors = ['event-violet', 'event-amber', 'event-teal', 'event-rose', 'event-indigo']
  return colors[index % colors.length]
}

export function getInitials(name: string) {
  return (name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, max: number) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
