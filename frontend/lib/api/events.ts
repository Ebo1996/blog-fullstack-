import apiClient from './client'

export interface EventQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  city?: string
  dateFrom?: string
  dateTo?: string
  priceMin?: number
  priceMax?: number
  sort?: string
  status?: string
  featured?: boolean
}

export const eventsApi = {
  list: (query: EventQuery = {}) =>
    apiClient.get<any>('/events', { params: query }),

  featured: (limit = 8) =>
    apiClient.get<any>('/events/featured', { params: { limit } }),

  upcoming: (limit = 12) =>
    apiClient.get<any>('/events/upcoming', { params: { limit } }),

  trending: (limit = 8) =>
    apiClient.get<any>('/events/trending', { params: { limit } }),

  getBySlug: (slug: string) =>
    apiClient.get<any>(`/events/${slug}`),

  related: (id: string, limit = 4) =>
    apiClient.get<any>(`/events/${id}/related`, { params: { limit } }),

  myEvents: (query: EventQuery = {}) =>
    apiClient.get<any>('/events/organizer/my-events', { params: query }),

  create: (data: any) =>
    apiClient.post<any>('/events', data),

  update: (id: string, data: any) =>
    apiClient.patch<any>(`/events/${id}`, data),

  publish: (id: string) =>
    apiClient.post<any>(`/events/${id}/publish`),

  unpublish: (id: string) =>
    apiClient.post<any>(`/events/${id}/unpublish`),

  cancel: (id: string) =>
    apiClient.post<any>(`/events/${id}/cancel`),

  duplicate: (id: string) =>
    apiClient.post<any>(`/events/${id}/duplicate`),

  delete: (id: string) =>
    apiClient.delete<any>(`/events/${id}`),

  getTicketTypes: (eventId: string) =>
    apiClient.get<any>(`/events/${eventId}/ticket-types`),

  createTicketType: (eventId: string, data: any) =>
    apiClient.post<any>(`/events/${eventId}/ticket-types`, data),

  updateTicketType: (eventId: string, ttId: string, data: any) =>
    apiClient.patch<any>(`/events/${eventId}/ticket-types/${ttId}`, data),

  pauseTicketType: (eventId: string, ttId: string) =>
    apiClient.post<any>(`/events/${eventId}/ticket-types/${ttId}/pause`),

  resumeTicketType: (eventId: string, ttId: string) =>
    apiClient.post<any>(`/events/${eventId}/ticket-types/${ttId}/resume`),

  deleteTicketType: (eventId: string, ttId: string) =>
    apiClient.delete<any>(`/events/${eventId}/ticket-types/${ttId}`),

  getCategories: () =>
    apiClient.get<any>('/categories'),
}
