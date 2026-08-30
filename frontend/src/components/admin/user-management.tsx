'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'

interface User {
  id: string
  full_name: string | null
  email: string
  role: 'attendee' | 'organizer' | 'admin'
  created_at: string
  updated_at: string
}

interface UserManagementProps {
  users: User[]
  onUpdateRole: (userId: string, newRole: 'attendee' | 'organizer' | 'admin') => Promise<{ success: boolean }>
}

export function UserManagement({ users, onUpdateRole }: UserManagementProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'attendee' | 'organizer' | 'admin'>('all')

  const filteredUsers = filter === 'all' ? users : users.filter((u) => u.role === filter)

  const handleRoleChange = async (user: User, newRole: 'attendee' | 'organizer' | 'admin') => {
    if (user.role === newRole) return
    if (!confirm(`Change ${user.full_name || user.email}'s role to ${newRole}?`)) return

    setUpdatingUserId(user.id)
    try {
      await onUpdateRole(user.id, newRole)
    } catch (_error) {
      alert('Failed to update role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const roleColors = {
    attendee: 'neutral' as const,
    organizer: 'info' as const,
    admin: 'error' as const,
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          All ({users.length})
        </Button>
        <Button
          variant={filter === 'attendee' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('attendee')}
        >
          Attendees ({users.filter((u) => u.role === 'attendee').length})
        </Button>
        <Button
          variant={filter === 'organizer' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('organizer')}
        >
          Organizers ({users.filter((u) => u.role === 'organizer').length})
        </Button>
        <Button variant={filter === 'admin' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('admin')}>
          Admins ({users.filter((u) => u.role === 'admin').length})
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{user.full_name || 'No name'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Joined {formatDate(user.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={roleColors[user.role]}>{user.role}</Badge>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={user.role === 'attendee' || updatingUserId === user.id}
                      onClick={() => handleRoleChange(user, 'attendee')}
                    >
                      Attendee
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={user.role === 'organizer' || updatingUserId === user.id}
                      onClick={() => handleRoleChange(user, 'organizer')}
                    >
                      Organizer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={user.role === 'admin' || updatingUserId === user.id}
                      onClick={() => handleRoleChange(user, 'admin')}
                    >
                      Admin
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No users found with this filter</div>
      )}
    </div>
  )
}
