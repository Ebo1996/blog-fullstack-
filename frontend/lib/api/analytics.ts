import apiClient from './client'

export const analyticsApi = {
  organizerOverview: () =>
    apiClient.get<any>('/analytics/organizer/overview'),

  eventAnalytics: (eventId: string) =>
    apiClient.get<any>(`/analytics/organizer/events/${eventId}`),

  platformOverview: () =>
    apiClient.get<any>('/analytics/admin/platform'),
}

export const adminApi = {
  listUsers: (params?: any) =>
    apiClient.get<any>('/admin/users', { params }),

  suspendUser: (id: string) =>
    apiClient.post<any>(`/admin/users/${id}/suspend`),

  unsuspendUser: (id: string) =>
    apiClient.post<any>(`/admin/users/${id}/unsuspend`),

  setRole: (id: string, role: string) =>
    apiClient.patch<any>(`/admin/users/${id}/role`, { role }),

  listEvents: (params?: any) =>
    apiClient.get<any>('/admin/events', { params }),

  featureEvent: (id: string) =>
    apiClient.post<any>(`/admin/events/${id}/feature`),

  unfeatureEvent: (id: string) =>
    apiClient.delete<any>(`/admin/events/${id}/feature`),

  listOrders: (params?: any) =>
    apiClient.get<any>('/admin/orders', { params }),

  auditLogs: (params?: any) =>
    apiClient.get<any>('/admin/audit-logs', { params }),
}
