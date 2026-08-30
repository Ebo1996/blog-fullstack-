/**
 * Notification service
 * Handles notification creation, read/unread state, and real-time subscriptions
 * Supports notification types:
 * - ticket_purchased / payment_completed
 * - ticket_transfer_received / accepted / rejected / cancelled
 * - event_reminder (1 day before, 1 hour before)
 * - event_updated / event_cancelled
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Notification } from '@/types/database'

export type NotificationType =
  | 'ticket_purchased'
  | 'payment_completed'
  | 'ticket_transfer_received'
  | 'ticket_transfer_accepted'
  | 'ticket_transfer_rejected'
  | 'ticket_transfer_cancelled'
  | 'event_reminder'
  | 'event_updated'
  | 'event_cancelled'

export interface NotificationData {
  event_id?: string
  ticket_id?: string
  order_id?: string
  transfer_id?: string
  [key: string]: unknown
}

// ─── CREATE NOTIFICATION ──────────────────────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
): Promise<Notification | null> {
  const service = createServiceClient()
  const { data: notification, error } = await service
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data: data ?? {},
    })
    .select('*')
    .single<Notification>()

  if (error) {
    console.error('[notifications] createNotification:', error)
    return null
  }

  return notification
}

// ─── BATCH CREATE NOTIFICATIONS ───────────────────────────────────────────────

export async function createNotifications(
  notifications: Array<{
    user_id: string
    type: NotificationType
    title: string
    message: string
    data?: NotificationData
  }>,
): Promise<boolean> {
  if (notifications.length === 0) return true

  const service = createServiceClient()
  const { error } = await service
    .from('notifications')
    .insert(
      notifications.map((n) => ({
        user_id: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data ?? {},
      })),
    )

  if (error) {
    console.error('[notifications] createNotifications:', error)
    return false
  }

  return true
}

// ─── GET USER NOTIFICATIONS ───────────────────────────────────────────────────

export async function getUserNotifications(
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Notification[]
}

// ─── GET UNREAD NOTIFICATIONS ─────────────────────────────────────────────────

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false })

  return (data ?? []) as Notification[]
}

// ─── GET UNREAD COUNT ─────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  return count ?? 0
}

// ─── MARK AS READ ─────────────────────────────────────────────────────────────

export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: notification } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', notificationId)
    .single<{ user_id: string }>()

  if (!notification || notification.user_id !== userId) {
    return false
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)

  return !error
}

// ─── MARK MULTIPLE AS READ ────────────────────────────────────────────────────

export async function markMultipleAsRead(
  notificationIds: string[],
  userId: string,
): Promise<boolean> {
  if (notificationIds.length === 0) return true

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', notificationIds)
    .eq('user_id', userId)

  return !error
}

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────

export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  return !error
}

// ─── DELETE NOTIFICATION ──────────────────────────────────────────────────────

export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)

  return !error
}

// ─── DELETE ALL NOTIFICATIONS ─────────────────────────────────────────────────

export async function deleteAllNotifications(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  return !error
}

// ─── HELPER: Create notification for order completion ─────────────────────────

export async function notifyOrderCompleted(
  userId: string,
  orderId: string,
  eventTitle: string,
  ticketCount: number,
): Promise<void> {
  await createNotification(
    userId,
    'payment_completed',
    'Payment completed',
    `Your order for ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} to ${eventTitle} is confirmed.`,
    { order_id: orderId },
  )
}

// ─── HELPER: Create notification for ticket creation ──────────────────────────

export async function notifyTicketsCreated(
  userId: string,
  eventId: string,
  eventTitle: string,
  ticketCount: number,
): Promise<void> {
  await createNotification(
    userId,
    'ticket_purchased',
    'Tickets ready',
    `Your ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} for ${eventTitle} ${ticketCount !== 1 ? 'are' : 'is'} ready to view.`,
    { event_id: eventId },
  )
}

// ─── HELPER: Create event reminder ────────────────────────────────────────────

export async function notifyEventReminder(
  userId: string,
  eventId: string,
  eventTitle: string,
  eventStart: string,
  timeframe: '1_day' | '1_hour',
): Promise<void> {
  const message =
    timeframe === '1_day'
      ? `${eventTitle} is tomorrow at ${new Date(eventStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
      : `${eventTitle} starts in 1 hour!`

  await createNotification(
    userId,
    'event_reminder',
    `Reminder: ${eventTitle}`,
    message,
    { event_id: eventId },
  )
}

// ─── HELPER: Notify event update ──────────────────────────────────────────────

export async function notifyEventUpdated(
  userIds: string[],
  eventId: string,
  eventTitle: string,
  changes: string,
): Promise<void> {
  await createNotifications(
    userIds.map((userId) => ({
      user_id: userId,
      type: 'event_updated' as NotificationType,
      title: `${eventTitle} updated`,
      message: changes,
      data: { event_id: eventId },
    })),
  )
}

// ─── HELPER: Notify event cancellation ────────────────────────────────────────

export async function notifyEventCancelled(
  userIds: string[],
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await createNotifications(
    userIds.map((userId) => ({
      user_id: userId,
      type: 'event_cancelled' as NotificationType,
      title: `${eventTitle} cancelled`,
      message: `Unfortunately, ${eventTitle} has been cancelled. You will receive a full refund.`,
      data: { event_id: eventId },
    })),
  )
}

// ─── REAL-TIME SUBSCRIPTION (client-side helper) ──────────────────────────────

/**
 * Subscribe to real-time notifications for a user
 * Usage in client components:
 * 
 * const supabase = createBrowserClient()
 * const channel = supabase
 *   .channel('notifications')
 *   .on('postgres_changes', {
 *     event: 'INSERT',
 *     schema: 'public',
 *     table: 'notifications',
 *     filter: `user_id=eq.${userId}`,
 *   }, (payload) => {
 *     // Handle new notification
 *     console.log('New notification:', payload.new)
 *   })
 *   .subscribe()
 * 
 * return () => { supabase.removeChannel(channel) }
 */
