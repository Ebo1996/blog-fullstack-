import apiClient from './client'

/**
 * Public-facing organizer API calls.
 * Used on /organizers/[slug] and related public pages.
 */
export const organizersApi = {
  /**
   * Get events by organizer ID (slug is the user's _id on the public page).
   */
  getEvents: (organizerId: string, params?: { limit?: number; page?: number }) =>
    apiClient.get<any>('/events', {
      params: { organizer: organizerId, sort: 'soonest', ...params },
    }),

  /**
   * Organizer dashboard: overview stats.
   */
  overview: () =>
    apiClient.get<any>('/analytics/organizer/overview'),

  /**
   * Organizer dashboard: attendees for an event.
   */
  attendees: (eventId: string, params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<any>(`/events/${eventId}/attendees`, { params }),

  /**
   * Organizer dashboard: orders for an event.
   */
  eventOrders: (eventId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<any>(`/orders`, { params: { eventId, ...params } }),
}
