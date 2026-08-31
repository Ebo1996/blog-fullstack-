'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'

export default function OrganizerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = () => {
    apiClient.get<any>('/notifications')
      .then((r) => {
        setNotifications(r.data?.notifications ?? [])
        setUnread(r.data?.unreadCount ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnread(0)
      toast.success('All marked as read')
    } catch { toast.error('Failed') }
  }

  const markOne = async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`).catch(() => {})
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
    )
    setUnread((u) => Math.max(0, u - 1))
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Notifications {unread > 0 && <span className="text-sm font-normal text-[var(--muted-foreground)]">({unread} unread)</span>}</h1>
        </div>
        {unread > 0 && (
          <div className="topbar-actions">
            <button onClick={markAllRead} className="btn btn-outline btn-sm gap-2">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          </div>
        )}
      </header>

      <div className="page-content max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="panel flex gap-4">
                <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton h-2.5 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markOne(n._id)}
                className={`panel flex items-start gap-4 cursor-pointer transition-colors ${
                  !n.isRead ? 'border-[var(--primary)]/30 bg-[rgba(215,243,106,0.03)]' : 'opacity-70'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${!n.isRead ? 'bg-[var(--primary)]' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{n.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{n.body}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && <Badge variant="info">New</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
