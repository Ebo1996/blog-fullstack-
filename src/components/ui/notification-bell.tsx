'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Check, X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelative } from '@/lib/utils/format'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

interface NotificationBellProps {
  userId: string
  initialUnreadCount: number
  initialNotifications: Notification[]
  markAsReadAction: (id: string, userId: string) => Promise<{ success: boolean }>
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  ticket_purchased:           <Badge variant="success">🎟️</Badge>,
  payment_completed:          <Badge variant="success">✓</Badge>,
  ticket_transfer_received:   <Badge variant="info">→</Badge>,
  ticket_transfer_accepted:   <Badge variant="success">✓</Badge>,
  ticket_transfer_rejected:   <Badge variant="neutral">✗</Badge>,
  ticket_transfer_cancelled:  <Badge variant="neutral">✗</Badge>,
  event_reminder:             <Badge variant="warning">⏰</Badge>,
  event_updated:              <Badge variant="info">ℹ</Badge>,
  event_cancelled:            <Badge variant="error">✗</Badge>,
}

export function NotificationBell({
  userId,
  initialUnreadCount,
  initialNotifications,
  markAsReadAction,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState(initialNotifications)

  // Real-time subscription
  useEffect(() => {
    const supabase = createBrowserClient()
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev].slice(0, 10))
          setUnreadCount((prev) => prev + 1)
          
          // Show toast notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon.svg',
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function handleMarkAsRead(notificationId: string) {
    const result = await markAsReadAction(notificationId, userId)
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        className="icon-button"
        style={{ position: 'relative' }}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'var(--error)',
              color: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              display: 'grid',
              placeItems: 'center',
            }}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="menu"
            aria-label="Notifications"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 41,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              width: 380,
              maxWidth: '90vw',
              boxShadow: 'var(--shadow-xl)',
              animation: 'slideDown 0.15s ease-out',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <strong style={{ fontSize: 14 }}>Notifications</strong>
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: 12,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View all
                <ExternalLink size={11} aria-hidden="true" />
              </Link>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--muted-foreground)',
                    fontSize: 13,
                  }}
                >
                  <Bell size={24} style={{ marginBottom: 8, opacity: 0.5 }} aria-hidden="true" />
                  <p style={{ margin: 0 }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onClose={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Individual notification item ─────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onClose: () => void
}) {
  const isUnread = !notification.read_at
  const icon = NOTIFICATION_ICONS[notification.type] ?? <Badge variant="neutral">•</Badge>

  // Determine link based on notification type and data
  let href = '/dashboard'
  if (notification.data) {
    const data = notification.data as Record<string, string>
    if (data.ticket_id) href = `/dashboard/tickets/${data.ticket_id}`
    else if (data.order_id) href = `/dashboard/orders/${data.order_id}`
    else if (data.transfer_id) href = '/dashboard/transfers'
    else if (data.event_id) href = `/events/${data.event_id}`
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: isUnread ? 'var(--muted)' : 'transparent',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        transition: 'background var(--transition-fast)',
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
        {icon}
      </div>

      {/* Content */}
      <Link
        href={href}
        onClick={onClose}
        style={{
          flex: 1,
          minWidth: 0,
          textDecoration: 'none',
          color: 'var(--foreground)',
        }}
      >
        <strong
          style={{
            fontSize: 13,
            display: 'block',
            marginBottom: 2,
            fontWeight: isUnread ? 700 : 600,
          }}
        >
          {notification.title}
        </strong>
        <p
          style={{
            fontSize: 12,
            color: 'var(--muted-foreground)',
            margin: '0 0 4px',
            lineHeight: 1.5,
          }}
        >
          {notification.message}
        </p>
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          {formatRelative(notification.created_at)}
        </span>
      </Link>

      {/* Mark as read */}
      {isUnread && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMarkAsRead(notification.id)
          }}
          aria-label="Mark as read"
          title="Mark as read"
          style={{
            background: 'none',
            border: 0,
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            padding: 4,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          <Check size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

void X
