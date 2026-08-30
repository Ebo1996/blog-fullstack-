/**
 * Event notification helpers
 * Handles notifying attendees when events are updated or cancelled
 */

import { createServiceClient } from '@/lib/supabase/service'
import { notifyEventUpdated, notifyEventCancelled } from './notifications'

// ─── Notify all event attendees ───────────────────────────────────────────────

export async function notifyEventAttendeesOfUpdate(
  eventId: string,
  eventTitle: string,
  changes: string,
): Promise<boolean> {
  const service = createServiceClient()

  // Get all users who have tickets for this event
  const { data: tickets } = await service
    .from('tickets')
    .select('user_id')
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .neq('status', 'transferred')

  if (!tickets || tickets.length === 0) return true

  // Get unique user IDs
  const userIds = Array.from(new Set(tickets.map((t) => t.user_id)))

  // Send notifications
  await notifyEventUpdated(userIds, eventId, eventTitle, changes)

  return true
}

export async function notifyEventAttendeesOfCancellation(
  eventId: string,
  eventTitle: string,
): Promise<boolean> {
  const service = createServiceClient()

  // Get all users who have tickets for this event
  const { data: tickets } = await service
    .from('tickets')
    .select('user_id')
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .neq('status', 'transferred')

  if (!tickets || tickets.length === 0) return true

  // Get unique user IDs
  const userIds = Array.from(new Set(tickets.map((t) => t.user_id)))

  // Send notifications
  await notifyEventCancelled(userIds, eventId, eventTitle)

  // Auto-cancel all tickets (refund would be handled separately)
  await service
    .from('tickets')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .neq('status', 'used')

  return true
}

// ─── Schedule event reminders (for future cron job implementation) ────────────

/**
 * This would be called by a scheduled job (e.g., Supabase Edge Function with pg_cron)
 * to send event reminders 1 day before and 1 hour before
 */
export async function sendEventReminders(): Promise<void> {
  const service = createServiceClient()
  const now = new Date()

  // 1-day reminders (events starting between 23-25 hours from now)
  const oneDayStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const oneDayEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: upcomingEvents } = await service
    .from('events')
    .select('id, title, start_at')
    .eq('status', 'published')
    .gte('start_at', oneDayStart.toISOString())
    .lte('start_at', oneDayEnd.toISOString())

  if (upcomingEvents && upcomingEvents.length > 0) {
    for (const event of upcomingEvents) {
      // Get attendees
      const { data: tickets } = await service
        .from('tickets')
        .select('user_id')
        .eq('event_id', event.id)
        .eq('status', 'active')

      if (!tickets || tickets.length === 0) continue

      const userIds = Array.from(new Set(tickets.map((t) => t.user_id)))

      // Create notifications
      await service.from('notifications').insert(
        userIds.map((userId) => ({
          user_id: userId,
          type: 'event_reminder',
          title: `Reminder: ${event.title}`,
          message: `${event.title} is tomorrow at ${new Date(event.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`,
          data: { event_id: event.id, timeframe: '1_day' },
        })),
      )
    }
  }

  // 1-hour reminders (events starting between 59-61 minutes from now)
  const oneHourStart = new Date(now.getTime() + 59 * 60 * 1000)
  const oneHourEnd   = new Date(now.getTime() + 61 * 60 * 1000)

  const { data: imminentEvents } = await service
    .from('events')
    .select('id, title, start_at')
    .eq('status', 'published')
    .gte('start_at', oneHourStart.toISOString())
    .lte('start_at', oneHourEnd.toISOString())

  if (imminentEvents && imminentEvents.length > 0) {
    for (const event of imminentEvents) {
      const { data: tickets } = await service
        .from('tickets')
        .select('user_id')
        .eq('event_id', event.id)
        .eq('status', 'active')

      if (!tickets || tickets.length === 0) continue

      const userIds = Array.from(new Set(tickets.map((t) => t.user_id)))

      await service.from('notifications').insert(
        userIds.map((userId) => ({
          user_id: userId,
          type: 'event_reminder',
          title: `Starting soon: ${event.title}`,
          message: `${event.title} starts in 1 hour!`,
          data: { event_id: event.id, timeframe: '1_hour' },
        })),
      )
    }
  }
}
