'use client'

import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { notificationsApi } from '@/lib/api/tickets'
import { EmptyState } from '@/components/ui/empty-state'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    notificationsApi.list({ limit: 50 })
      .then((r) => setNotifications(r.data?.notifications ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch {}
  }

  const handleMarkOne = async (id: string) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">UPDATES</div>
          <h1>Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <div className="topbar-actions">
            <button onClick={handleMarkAll} className="btn btn-outline btn-sm gap-2">
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>
        )}
      </header>

      <div className="page-content">
        {loading ? (
          <div className="panel space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-[var(--border)]">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-64" /><div className="skeleton h-2.5 w-24" /></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications about your tickets and events will appear here." />
        ) : (
          <div className="panel">
            {notifications.map((n, i) => (
              <div
                key={n._id}
                className={`flex items-start gap-4 py-4 cursor-pointer hover:bg-[var(--muted)] -mx-6 px-6 transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''} ${!n.isRead ? 'bg-[rgba(215,243,106,0.03)]' : ''}`}
                onClick={() => !n.isRead && handleMarkOne(n._id)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.isRead ? 'bg-[var(--muted)]' : 'bg-[rgba(215,243,106,0.15)]'}`}>
                  <Bell className={`w-3.5 h-3.5 ${n.isRead ? 'text-[var(--muted-foreground)]' : 'text-[var(--primary)]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${n.isRead ? 'text-[var(--muted-foreground)]' : 'font-semibold'}`}>{n.message}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
