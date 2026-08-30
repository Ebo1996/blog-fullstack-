import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  )
}

// ─── Preset skeleton shapes ───────────────────────────────────────────────────

export function SkeletonText({ width = '100%' }: { width?: string | number }) {
  return <Skeleton className="skeleton-text" style={{ width }} />
}

export function SkeletonHeading({ width = '60%' }: { width?: string | number }) {
  return <Skeleton className="skeleton-heading" style={{ width }} />
}

export function SkeletonAvatar({ size = 32 }: { size?: number }) {
  return (
    <Skeleton
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <SkeletonHeading width="50%" />
      <SkeletonText width="90%" />
      <SkeletonText width="75%" />
      <SkeletonText width="80%" />
    </div>
  )
}

export function SkeletonTicketCard() {
  return (
    <div className="ticket-card" aria-hidden="true">
      <Skeleton style={{ width: '42%', minHeight: 194 }} />
      <div style={{ padding: '25px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton className="skeleton-text" style={{ width: 60 }} />
        <Skeleton className="skeleton-heading" style={{ width: '80%' }} />
        <Skeleton className="skeleton-text" style={{ width: '60%' }} />
        <Skeleton className="skeleton-text" style={{ width: '50%' }} />
      </div>
    </div>
  )
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <Skeleton className="skeleton-text" style={{ width: i === 0 ? '80%' : '60%' }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <Skeleton className="skeleton-text" style={{ width: 80 }} />
      <Skeleton className="skeleton-heading" style={{ width: '60%', marginTop: 8 }} />
      <Skeleton className="skeleton-text" style={{ width: 60, marginTop: 4 }} />
    </div>
  )
}
