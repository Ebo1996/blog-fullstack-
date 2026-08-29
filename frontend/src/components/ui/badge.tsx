import * as React from 'react'
import { cn } from '@/lib/utils'
import type {
  EventStatus,
  OrderStatus,
  TicketStatus,
  RegistrationStatus,
  TransferStatus,
} from '@/types/database'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'outline' | 'secondary'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
  primary: 'badge-primary',
  outline: 'badge-outline',
  secondary: 'badge-secondary',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variantClass[variant], className)}>
      {children}
    </span>
  )
}

// ─── Semantic status badges ───────────────────────────────────────────────────

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { label: string; variant: BadgeVariant }> = {
    draft:     { label: 'Draft',     variant: 'neutral' },
    published: { label: 'Published', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    completed: { label: 'Completed', variant: 'info' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
    pending:             { label: 'Pending',    variant: 'warning' },
    paid:                { label: 'Paid',       variant: 'success' },
    failed:              { label: 'Failed',     variant: 'error' },
    cancelled:           { label: 'Cancelled',  variant: 'neutral' },
    refunded:            { label: 'Refunded',   variant: 'info' },
    partially_refunded:  { label: 'Part. Refunded', variant: 'warning' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
    active:      { label: 'Active',      variant: 'success' },
    used:        { label: 'Used',        variant: 'neutral' },
    cancelled:   { label: 'Cancelled',   variant: 'error' },
    transferred: { label: 'Transferred', variant: 'info' },
    expired:     { label: 'Expired',     variant: 'neutral' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, { label: string; variant: BadgeVariant }> = {
    confirmed:  { label: 'Confirmed',  variant: 'success' },
    cancelled:  { label: 'Cancelled',  variant: 'error' },
    waitlisted: { label: 'Waitlisted', variant: 'warning' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const map: Record<TransferStatus, { label: string; variant: BadgeVariant }> = {
    pending:   { label: 'Pending',   variant: 'warning' },
    accepted:  { label: 'Accepted',  variant: 'success' },
    rejected:  { label: 'Rejected',  variant: 'error' },
    cancelled: { label: 'Cancelled', variant: 'neutral' },
    expired:   { label: 'Expired',   variant: 'neutral' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Status dot (inline) ─────────────────────────────────────────────────────

interface StatusDotProps {
  tone?: 'success' | 'neutral' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}

export function StatusDot({ tone = 'success', children }: StatusDotProps) {
  const colorMap = {
    success: 'var(--success)',
    neutral: 'var(--muted-foreground)',
    warning: 'var(--warning)',
    error: 'var(--error)',
    info: 'var(--info)',
  }
  return (
    <span className={cn('status', tone !== 'success' && `status-${tone}`)}>
      <span className="status-dot" style={{ background: colorMap[tone] }} />
      {children}
    </span>
  )
}
