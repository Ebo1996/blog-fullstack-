import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AttendeeHeader } from '@/components/attendee/header'
import { NotificationsClient } from '@/components/attendee/notifications-client'
import { getUserNotifications, getUnreadCount } from '@/services/notifications'
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
  deleteAllNotificationsAction,
} from './actions'
import type { Profile } from '@/types/database'
import type { NotificationActionResult } from './actions'

export const metadata: Metadata = { title: 'Notifications — Dashboard' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile) redirect('/login')

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id, 100),
    getUnreadCount(user.id),
  ])

  // Bind server actions
  const boundMarkAsRead = async (
    id: string,
    userId: string,
  ): Promise<NotificationActionResult> => {
    'use server'
    return markAsReadAction(id, userId)
  }

  const boundMarkAllAsRead = async (userId: string): Promise<NotificationActionResult> => {
    'use server'
    return markAllAsReadAction(userId)
  }

  const boundDelete = async (
    id: string,
    userId: string,
  ): Promise<NotificationActionResult> => {
    'use server'
    return deleteNotificationAction(id, userId)
  }

  const boundDeleteAll = async (userId: string): Promise<NotificationActionResult> => {
    'use server'
    return deleteAllNotificationsAction(userId)
  }

  return (
    <>
      <AttendeeHeader
        title="Notifications"
        eyebrow="ACTIVITY"
        profile={profile}
      />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`
              : "You're all caught up!"}
          </p>
        </div>

        <NotificationsClient
          notifications={notifications}
          userId={user.id}
          markAsReadAction={boundMarkAsRead}
          markAllAsReadAction={boundMarkAllAsRead}
          deleteAction={boundDelete}
          deleteAllAction={boundDeleteAll}
        />
      </main>
    </>
  )
}
