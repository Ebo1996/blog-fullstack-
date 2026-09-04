'use client'

import { useEffect, useState } from 'react'
import { Users, Search, ShieldOff, Shield, ChevronDown } from 'lucide-react'
import { adminApi } from '@/lib/api/analytics'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const load = (q?: string, r?: string) => {
    setLoading(true)
    adminApi.listUsers({ search: q ?? search, role: r ?? role, limit: 100 })
      .then((res) => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSuspend = async (id: string) => {
    setActionId(id)
    try { await adminApi.suspendUser(id); load(); toast.success('User suspended') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  const handleUnsuspend = async (id: string) => {
    setActionId(id)
    try { await adminApi.unsuspendUser(id); load(); toast.success('User unsuspended') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  const handleRole = async (id: string, newRole: string) => {
    setActionId(id)
    try { await adminApi.setRole(id, newRole); load(); toast.success('Role updated') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  const roleBadge = (r: string) => {
    if (r === 'admin') return <Badge variant="danger">Admin</Badge>
    if (r === 'organizer') return <Badge variant="info">Organizer</Badge>
    return <Badge variant="neutral">Attendee</Badge>
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Users</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); load() }} className="flex gap-2 flex-1">
            <label className="flex items-center gap-2 input-field flex-1" style={{ height: 42 }}>
              <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="flex-1 bg-transparent outline-none text-xs"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); load(search, e.target.value) }}
            className="input-field text-xs"
            style={{ height: 42, minWidth: 140 }}
          >
            <option value="">All roles</option>
            <option value="attendee">Attendee</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {loading ? (
          <div className="panel">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)]">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-44" /><div className="skeleton h-2.5 w-32" /></div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="panel overflow-x-auto">
            <p className="text-xs text-[var(--muted-foreground)] mb-4 px-1">{users.length} users</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.image ? (
                          <img 
                            src={u.image} 
                            alt={u.name} 
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <span className="avatar w-7 h-7 text-xs flex-shrink-0">{getInitials(u.name)}</span>
                        )}
                        <div>
                          <p className="text-xs font-medium">{u.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{roleBadge(u.role)}</td>
                    <td className="text-xs text-[var(--muted-foreground)]">{formatDate(u.createdAt)}</td>
                    <td>
                      {u.isSuspended
                        ? <Badge variant="danger" dot>Suspended</Badge>
                        : <Badge variant="success" dot>Active</Badge>
                      }
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {u.isSuspended ? (
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
                        {u.role !== 'admin' && (
                          <select
                            value={u.role}
                            onChange={(e) => handleRole(u._id, e.target.value)}
                            disabled={actionId === u._id}
                            className="input-field text-xs"
                            style={{ height: 32, minWidth: 110 }}
                            aria-label="Change role"
                          >
                            <option value="attendee">Attendee</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
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
