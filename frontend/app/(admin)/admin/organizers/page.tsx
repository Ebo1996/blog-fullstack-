'use client'

import { useEffect, useState } from 'react'
import { Users, Search, ShieldOff, Shield, ExternalLink } from 'lucide-react'
import { adminApi } from '@/lib/api/analytics'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const load = (q?: string) => {
    setLoading(true)
    adminApi.listUsers({ search: q ?? search, role: 'organizer', limit: 100 })
      .then((res) => setOrganizers(res.data?.users ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSuspend = async (id: string) => {
    setActionId(id)
    try { await adminApi.suspendUser(id); load(); toast.success('Organizer suspended') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  const handleUnsuspend = async (id: string) => {
    setActionId(id)
    try { await adminApi.unsuspendUser(id); load(); toast.success('Organizer unsuspended') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Organizers</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="flex gap-3 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); load() }} className="flex gap-2 flex-1">
            <label className="flex items-center gap-2 input-field flex-1" style={{ height: 42 }}>
              <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizers…"
                className="flex-1 bg-transparent outline-none text-xs"
                aria-label="Search organizers"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>

        {loading ? (
          <div className="panel">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)]">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-44" />
                  <div className="skeleton h-2.5 w-32" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : organizers.length === 0 ? (
          <EmptyState icon={Users} title="No organizers found" description="Users with the organizer role will appear here." />
        ) : (
          <div className="panel overflow-x-auto">
            <p className="text-xs text-[var(--muted-foreground)] mb-4 px-1">{organizers.length} organizers</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organizer</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Events</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="avatar w-8 h-8 text-xs flex-shrink-0">{getInitials(u.name)}</span>
                        <div>
                          <p className="text-xs font-medium">{u.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-[var(--muted-foreground)]">{formatDate(u.createdAt)}</td>
                    <td>
                      {u.isActive === false
                        ? <Badge variant="danger" dot>Suspended</Badge>
                        : <Badge variant="success" dot>Active</Badge>}
                    </td>
                    <td>
                      <Link
                        href={`/organizers/${u._id}`}
                        className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                        target="_blank"
                      >
                        View events <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {u.isActive === false ? (
                          <button
                            onClick={() => handleUnsuspend(u._id)}
                            disabled={actionId === u._id}
                            className="btn btn-outline btn-sm gap-1.5"
                          >
                            <Shield className="w-3 h-3" /> Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(u._id)}
                            disabled={actionId === u._id}
                            className="btn btn-outline btn-sm gap-1.5 hover:text-[var(--destructive)]"
                          >
                            <ShieldOff className="w-3 h-3" /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
