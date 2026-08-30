'use server'

import { revalidatePath } from 'next/cache'
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '@/services/notifications'

export interface NotificationActionResult {
  success: boolean
  error?: string
}

export async function markAsReadAction(
  notificationId: string,
  userId: string,
): Promise<NotificationActionResult> {
  const success = await markAsRead(notificationId, userId)
  if (success) {
    revalidatePath('/dashboard/notifications')
    revalidatePath('/dashboard')
  }
  return { success, error: success ? undefined : 'Could not mark as read' }
}

export async function markAllAsReadAction(userId: string): Promise<NotificationActionResult> {
  const success = await markAllAsRead(userId)
  if (success) {
    revalidatePath('/dashboard/notifications')
    revalidatePath('/dashboard')
  }
  return { success, error: success ? undefined : 'Could not mark all as read' }
}

export async function deleteNotificationAction(
  notificationId: string,
  userId: string,
): Promise<NotificationActionResult> {
  const success = await deleteNotification(notificationId, userId)
  if (success) {
    revalidatePath('/dashboard/notifications')
  }
  return { success, error: success ? undefined : 'Could not delete notification' }
}

export async function deleteAllNotificationsAction(
  userId: string,
): Promise<NotificationActionResult> {
  const success = await deleteAllNotifications(userId)
  if (success) {
    revalidatePath('/dashboard/notifications')
  }
  return { success, error: success ? undefined : 'Could not delete notifications' }
}
