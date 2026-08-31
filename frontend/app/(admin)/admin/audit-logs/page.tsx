'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { adminApi } from '@/lib/api/analytics'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDateTime } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  user_login: 'badge-info',
  event_created: 'badge-success',
  event_published: 'badge-success',
  event_cancelled: 'badge-danger',
  order_created: 'badge-info',
  payment_confirmed: 'badge-success',
  ticket_transferred: 'badge-warning',
  ticket_checked_in: 'badge-neutral',
  user_suspended: 'badge-danger',
  refund_processed: 'badge-warning',
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = (p = 1) => {
    setLoading(true)
    adminApi.auditLogs({ page: p, limit: 50 })
      .then((r) => {
        setLogs(r.data?.logs ?? r.data ?? [])
        setTotal(r.data?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Audit logs</h1>
        </div>
      </header>

      <div className="page-content">
        <p className="text-xs text-[var(--muted-foreground)] mb-6">
          A record of all sensitive platform actions. {total > 0 && `${total.toLocaleString()} total entries.`}
        </p>

        {loading ? (
          <div className="panel">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 py-3 border-b border-[var(--border)]">
                <div className="skeleton w-20 h-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-56" />
                  <div className="skeleton h-2.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No audit logs" description="Sensitive actions will be logged here." />
        ) : (
          <div className="panel">
            {logs.map((log, i) => {
              const cls = ACTION_COLORS[log.action] ?? 'badge-neutral'
              return (
                <div key={log._id} className={`flex items-start gap-4 py-3.5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                  <span className={`badge ${cls} flex-shrink-0 mt-0.5`}>{log.action?.replace(/_/g, ' ')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">
                      {log.userId?.name ?? 'System'}
                      {log.entityType && <span className="text-[var(--muted-foreground)]"> · {log.entityType}</span>}
                    </p>
                    {log.metadata && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                        {JSON.stringify(log.metadata).slice(0, 120)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm">Previous</button>
            <span className="text-xs text-[var(--muted-foreground)] flex items-center">Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < 50} className="btn btn-outline btn-sm">Next</button>
          </div>
        )}
      </div>
    </>
  )
}
