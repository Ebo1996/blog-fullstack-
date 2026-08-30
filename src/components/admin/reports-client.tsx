'use client'

import { useState, useTransition } from 'react'
import { Flag, CheckCircle, ExternalLink, AlertCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatRelative } from '@/lib/utils/format'
import type { AdminReport } from '@/services/admin'
import type { AdminActionResult } from '@/app/admin/actions'

interface ReportsClientProps {
  reports: AdminReport[]
  dismissAction: (id: string) => Promise<AdminActionResult>
}

type FilterStatus = 'all' | 'pending' | 'dismissed' | 'actioned'

const STATUS_BADGES: Record<AdminReport['status'], React.ReactNode> = {
  pending:   <Badge variant="warning">Pending</Badge>,
  dismissed: <Badge variant="neutral">Dismissed</Badge>,
  actioned:  <Badge variant="success">Actioned</Badge>,
}

const TYPE_ICONS: Record<AdminReport['target_type'], React.ReactNode> = {
  event:     <Flag size={14} />,
  user:      <AlertCircle size={14} />,
  organizer: <AlertCircle size={14} />,
}

export function ReportsClient({ reports, dismissAction }: ReportsClientProps) {
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filtered = filter === 'all'
    ? reports
    : reports.filter((r) => r.status === filter)

  const pendingCount   = reports.filter((r) => r.status === 'pending').length
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length
  const actionedCount  = reports.filter((r) => r.status === 'actioned').length

  return (
    <div>
      {/* Tabs */}
      <div className="tabs" role="tablist" aria-label="Filter reports" style={{ marginBottom: 20 }}>
        {([
          { value: 'all',       label: 'All',       count: reports.length },
          { value: 'pending',   label: 'Pending',   count: pendingCount },
          { value: 'dismissed', label: 'Dismissed', count: dismissedCount },
          { value: 'actioned',  label: 'Actioned',  count: actionedCount },
        ] as Array<{ value: FilterStatus; label: string; count: number }>).map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={filter === tab.value}
            className={`tab-item${filter === tab.value ? ' active' : ''}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: filter === tab.value ? 'var(--admin-accent)' : 'var(--muted)',
                  color: filter === tab.value ? '#fff' : 'var(--muted-foreground)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={24} />}
          title={filter === 'pending' ? 'No pending reports' : 'No reports'}
          description={
            filter === 'pending'
              ? 'All reports have been reviewed. Platform is clean.'
              : 'No reports match this filter.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              dismissAction={dismissAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual report card ────────────────────────────────────────────────────

function ReportCard({
  report,
  dismissAction,
}: {
  report: AdminReport
  dismissAction: (id: string) => Promise<AdminActionResult>
}) {
  const [pending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState(report.status)
  const [error, setError]             = useState<string | null>(null)

  function handleDismiss() {
    if (localStatus !== 'pending') return
    setError(null)
    startTransition(async () => {
      const res = await dismissAction(report.id)
      if (res.error) { setError(res.error); return }
      setLocalStatus('dismissed')
    })
  }

  const isPending  = localStatus === 'pending'
  const targetHref = report.target_type === 'event'
    ? `/admin/events`
    : `/admin/users`

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid',
        borderColor: isPending ? 'rgba(216,174,98,0.3)' : 'var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        opacity: localStatus === 'dismissed' ? 0.65 : 1,
        transition: 'opacity var(--transition-base)',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Icon */}
        <span
          style={{
            display: 'grid', placeItems: 'center',
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: isPending ? 'var(--warning-bg)' : 'var(--muted)',
            color: isPending ? 'var(--warning)' : 'var(--muted-foreground)',
          }}
          aria-hidden="true"
        >
          {TYPE_ICONS[report.target_type]}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
              {report.target_type.charAt(0).toUpperCase() + report.target_type.slice(1)} reported
              {report.target_name ? `: ${report.target_name}` : ''}
            </p>
            {STATUS_BADGES[localStatus]}
          </div>

          <p style={{ fontSize: 13, color: 'var(--foreground)', margin: '0 0 8px', lineHeight: 1.6 }}>
            {report.reason || 'No reason provided.'}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted-foreground)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} aria-hidden="true" />
              {formatRelative(report.created_at)}
            </span>
            <span>Reported by: {report.reporter_name ?? 'Unknown'}</span>
            <span>Date: {formatDate(report.created_at, 'MMM d, yyyy')}</span>
          </div>

          {error && (
            <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 6 }} role="alert">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {/* View target */}
          <a
            href={targetHref}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 6,
              border: '1px solid var(--border)', fontSize: 11,
              fontWeight: 600, color: 'var(--foreground)',
              textDecoration: 'none',
            }}
            aria-label={`View ${report.target_type}`}
          >
            <ExternalLink size={11} aria-hidden="true" />
            View
          </a>

          {isPending && (
            <>
              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                disabled={pending}
                aria-busy={pending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  border: '0', fontSize: 11, fontWeight: 600,
                  background: 'var(--muted)', color: 'var(--foreground)',
                  cursor: 'pointer', opacity: pending ? 0.5 : 1,
                  transition: 'opacity var(--transition-fast)',
                }}
                aria-label="Dismiss report"
              >
                <CheckCircle size={11} aria-hidden="true" />
                {pending ? 'Dismissing…' : 'Dismiss'}
              </button>

              {/* Suspend target — links to users page with context */}
              <a
                href={`/admin/users`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  border: '1px solid rgba(224,107,107,0.3)',
                  background: 'var(--error-bg)', color: 'var(--error)',
                  fontSize: 11, fontWeight: 600, textDecoration: 'none',
                }}
                aria-label="Take action on report"
              >
                <Flag size={11} aria-hidden="true" />
                Act
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
