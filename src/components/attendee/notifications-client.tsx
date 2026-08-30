'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, CheckCheck, Trash2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Alert } from '@/components/ui/alert'
import { formatDate, formatRelative } from '@/lib/utils/format'
import type { Notification } from '@/types/database'
import type { NotificationActionResult } from '@/app/dashboard/notifications/actions'

interface NotificationsClientProps {
  notifications: Notification[]
  userId: string
  markAsReadAction: (id: string, userId: string) => Promise<NotificationActionResult>
  markAllAsReadAction: (userId: string) => Promise<NotificationActionResult>
  deleteAction: (id: string, userId: string) => Promise<NotificationActionResult>
  deleteAllAction: (userId: string) => Promise<NotificationActionResult>
}

type Filter = 'all' | 'unread'

const NOTIFICATION_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
  ticket_purchased:           'success',
  payment_completed:          'success',
  ticket_transfer_received:   'info',
  ticket_transfer_accepted:   'success',
  ticket_transfer_rejected:   'neutral',
  ticket_transfer_cancelled:  'neutral',
  event_reminder:             'warning',
  event_updated:              'info',
  event_cancelled:            'error',
}

export function NotificationsClient({
  notifications,
  userId,
  markAsReadAction,
  markAllAsReadAction,
  deleteAction,
  deleteAllAction,
}: NotificationsClientProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.read_at)
    : notifications

  const unreadCount = notifications.filter((n) => !n.read_at).length

  function handleMarkAllAsRead() {
    setError(null)
    startTransition(async () => {
      const result = await markAllAsReadAction(userId)
      if (result.error) setError(result.error)
    })
  }

  function handleDeleteAll() {
    if (!confirm('Delete all notifications? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteAllAction(userId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div>
      {error && (
        <Alert variant="error" style={{ marginBottom: 16 }}>
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        {/* Tabs */}
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={filter === 'all'}
            className={`tab-item${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
            {notifications.length > 0 && (
              <span className="tab-count">{notifications.length}</span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={filter === 'unread'}
            className={`tab-item${filter === 'unread' ? ' active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <span className="tab-count" style={{ background: 'var(--primary)' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={pending}
                className="button button-muted button-sm"
                style={{ gap: 6 }}
              >
                <CheckCheck size={13} aria-hidden="true" />
                Mark all read
              </button>
            )}
            <button
              onClick={handleDeleteAll}
              disabled={pending}
              className="button button-muted button-sm"
              style={{ gap: 6, color: 'var(--error)' }}
            >
              <Trash2 size={13} aria-hidden="true" />
              Delete all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Check size={24} />}
          title={filter === 'unread' ? 'All caught up' : 'No notifications'}
          description={
            filter === 'unread'
              ? 'You have no unread notifications.'
              : 'Notifications will appear here when you receive them.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              userId={userId}
              markAsReadAction={markAsReadAction}
              deleteAction={deleteAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual notification card ─────────────────────────────────────────────

function NotificationCard({
  notification,
  userId,
  markAsReadAction,
  deleteAction,
}: {
  notification: Notification
  userId: string
  markAsReadAction: (id: string, userId: string) => Promise<NotificationActionResult>
  deleteAction: (id: string, userId: string) => Promise<NotificationActionResult>
}) {
  const [pending, startTransition] = useTransition()
  const [localReadAt, setLocalReadAt] = useState(notification.read_at)

  const isUnread = !localReadAt
  const variant = NOTIFICATION_VARIANTS[notification.type] ?? 'neutral'

  function handleMarkAsRead() {
    startTransition(async () => {
      const result = await markAsReadAction(notification.id, userId)
      if (result.success) {
        setLocalReadAt(new Date().toISOString())
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAction(notification.id, userId)
    })
  }

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
      className="panel"
      style={{
        padding: 0,
        overflow: 'hidden',
        opacity: pending ? 0.5 : 1,
        transition: 'opacity var(--transition-base)',
      }}
    >
      <div style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Badge */}
        <div style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
          <Badge variant={variant}>
            {notification.type === 'ticket_purchased' && '🎟️'}
            {notification.type === 'payment_completed' && '✓'}
            {notification.type === 'ticket_transfer_received' && '→'}
            {notification.type === 'ticket_transfer_accepted' && '✓'}
            {notification.type === 'ticket_transfer_rejected' && '✗'}
            {notification.type === 'ticket_transfer_cancelled' && '✗'}
            {notification.type === 'event_reminder' && '⏰'}
            {notification.type === 'event_updated' && 'ℹ'}
            {notification.type === 'event_cancelled' && '✗'}
            {!['ticket_purchased', 'payment_completed', 'ticket_transfer_received', 'ticket_transfer_accepted', 'ticket_transfer_rejected', 'ticket_transfer_cancelled', 'event_reminder', 'event_updated', 'event_cancelled'].includes(notification.type) && '•'}
          </Badge>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <Link
              href={href}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                fontWeight: isUnread ? 600 : 400,
                textDecoration: 'none',
                color: 'var(--foreground)',
                letterSpacing: '-0.01em',
              }}
            >
              {notification.title}
            </Link>
            {isUnread && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  flexShrink: 0,
                  marginTop: 6,
                }}
                aria-label="Unread"
              />
            )}
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 8px', lineHeight: 1.6 }}>
            {notification.message}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--muted-foreground)' }}>
            <span>{formatRelative(notification.created_at)}</span>
            <span>•</span>
            <span>{formatDate(notification.created_at, 'MMM d, yyyy · h:mm a')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 18px',
          background: 'var(--muted)',
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={handleDelete}
          disabled={pending}
          className="button button-muted button-sm"
          style={{ gap: 5 }}
        >
          <Trash2 size={12} aria-hidden="true" />
          Delete
        </button>
        {isUnread && (
          <button
            onClick={handleMarkAsRead}
            disabled={pending}
            className="button button-muted button-sm"
            style={{ gap: 5 }}
          >
            <Check size={12} aria-hidden="true" />
            Mark as read
          </button>
        )}
      </div>
    </div>
  )
}
