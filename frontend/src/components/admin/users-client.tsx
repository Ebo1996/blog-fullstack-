'use client'

import { useState, useTransition, useMemo } from 'react'
import { Search, UserX, UserCheck, Shield, ShieldOff, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatRelative } from '@/lib/utils/format'
import type { AdminUserRow } from '@/services/admin'
import type { AdminActionResult } from '@/app/admin/actions'
import type { UserRole } from '@/types/database'

interface UsersClientProps {
  users: AdminUserRow[]
  suspendAction:    (id: string) => Promise<AdminActionResult>
  reactivateAction: (id: string) => Promise<AdminActionResult>
  changeRoleAction: (id: string, role: UserRole) => Promise<AdminActionResult>
}

const ROLE_COLORS: Record<UserRole, 'success' | 'info' | 'error'> = {
  attendee:  'neutral' as 'success',
  organizer: 'info',
  admin:     'error',
}

export function UsersClient({
  users,
  suspendAction,
  reactivateAction,
  changeRoleAction,
}: UsersClientProps) {
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  const filtered = useMemo(() => {
    let rows = users
    if (roleFilter !== 'all') rows = rows.filter((u) => u.role === roleFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      )
    }
    return rows
  }, [users, search, roleFilter])

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="form-input"
            style={{ paddingLeft: 36 }}
            aria-label="Search users"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          <option value="attendee">Attendee</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>
        {filtered.length} user{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  suspendAction={suspendAction}
                  reactivateAction={reactivateAction}
                  changeRoleAction={changeRoleAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Individual user row ──────────────────────────────────────────────────────

function UserRow({
  user,
  suspendAction,
  reactivateAction,
  changeRoleAction,
}: {
  user: AdminUserRow
  suspendAction:    (id: string) => Promise<AdminActionResult>
  reactivateAction: (id: string) => Promise<AdminActionResult>
  changeRoleAction: (id: string, role: UserRole) => Promise<AdminActionResult>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)
  const [localSuspended, setLocalSuspended] = useState(user.suspended)
  const [showRoleMenu, setShowRoleMenu]      = useState(false)
  const [localRole, setLocalRole]            = useState<UserRole>(user.role)

  function handleSuspend() {
    setError(null)
    startTransition(async () => {
      const res = localSuspended
        ? await reactivateAction(user.id)
        : await suspendAction(user.id)
      if (res.error) { setError(res.error); return }
      setLocalSuspended(!localSuspended)
    })
  }

  function handleRoleChange(newRole: UserRole) {
    setShowRoleMenu(false)
    if (newRole === localRole) return
    setError(null)
    startTransition(async () => {
      const res = await changeRoleAction(user.id, newRole)
      if (res.error) { setError(res.error); return }
      setLocalRole(newRole)
    })
  }

  const roleVariant = ROLE_COLORS[localRole] ?? 'neutral'

  return (
    <tr style={{ opacity: localSuspended ? 0.55 : 1 }}>
      {/* User */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
              {user.full_name ?? 'Unknown'}
            </p>
            {error && (
              <p style={{ fontSize: 11, color: 'var(--error)', margin: 0 }} role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Email */}
      <td style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
        {user.email ?? '—'}
      </td>

      {/* Role — clickable to change */}
      <td>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowRoleMenu((v) => !v)}
            disabled={pending || localRole === 'admin'}
            aria-haspopup="listbox"
            aria-expanded={showRoleMenu}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 0, cursor: localRole === 'admin' ? 'default' : 'pointer',
              padding: 0,
            }}
            aria-label={`Change role for ${user.full_name ?? 'user'}`}
          >
            <Badge variant={roleVariant === 'neutral' as 'success' ? 'neutral' : roleVariant}>
              {localRole}
            </Badge>
            {localRole !== 'admin' && <ChevronDown size={11} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />}
          </button>

          {showRoleMenu && (
            <div
              role="listbox"
              aria-label="Select role"
              style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 10,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', minWidth: 130,
                boxShadow: 'var(--shadow-md)', marginTop: 4, overflow: 'hidden',
              }}
            >
              {(['attendee', 'organizer'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  role="option"
                  aria-selected={role === localRole}
                  onClick={() => handleRoleChange(role)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 14px', fontSize: 12, fontWeight: role === localRole ? 700 : 400,
                    background: role === localRole ? 'var(--muted)' : 'transparent',
                    border: 0, cursor: 'pointer', color: 'var(--foreground)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)' }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = role === localRole ? 'var(--muted)' : 'transparent' }}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td>
        {localSuspended ? (
          <Badge variant="error">Suspended</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </td>

      {/* Joined */}
      <td style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
        {formatDate(user.created_at, 'MMM d, yyyy')}
      </td>

      {/* Actions */}
      <td>
        <button
          onClick={handleSuspend}
          disabled={pending || localRole === 'admin'}
          aria-busy={pending}
          title={localSuspended ? 'Reactivate user' : 'Suspend user'}
          aria-label={localSuspended
            ? `Reactivate ${user.full_name ?? 'user'}`
            : `Suspend ${user.full_name ?? 'user'}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 6, fontSize: 11,
            fontWeight: 600, cursor: localRole === 'admin' ? 'not-allowed' : 'pointer',
            border: '1px solid',
            background:   localSuspended ? 'var(--success-bg)' : 'var(--error-bg)',
            color:        localSuspended ? 'var(--success)'    : 'var(--error)',
            borderColor:  localSuspended ? 'rgba(200,231,107,0.25)' : 'rgba(224,107,107,0.25)',
            opacity: (pending || localRole === 'admin') ? 0.4 : 1,
            transition: 'opacity var(--transition-fast)',
          }}
        >
          {localSuspended
            ? <><UserCheck size={12} aria-hidden="true" /> Reactivate</>
            : <><UserX size={12} aria-hidden="true" /> Suspend</>
          }
        </button>
      </td>
    </tr>
  )
}

void Shield
void ShieldOff
void formatRelative
