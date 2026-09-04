import apiClient from './client'

export const ticketsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<any>('/tickets', { params }),

  get: (id: string) =>
    apiClient.get<any>(`/tickets/${id}`),

  getQr: (id: string) =>
    apiClient.get<any>(`/tickets/${id}/qr`),

  byOrder: (orderId: string) =>
    apiClient.get<any>(`/tickets/order/${orderId}`),

  byEvent: (eventId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<any>(`/tickets/event/${eventId}/tickets`, { params }),

  // Transfers
  initiateTransfer: (ticketId: string, recipientEmail: string, message?: string) =>
    apiClient.post<any>('/transfers', { ticketId, recipientEmail, message }),

  myTransfers: () =>
    apiClient.get<any>('/transfers'),

  pendingTransfers: () =>
    apiClient.get<any>('/transfers/pending'),

  acceptTransfer: (id: string) =>
    apiClient.post<any>(`/transfers/${id}/accept`),

  rejectTransfer: (id: string) =>
    apiClient.post<any>(`/transfers/${id}/reject`),

  cancelTransfer: (id: string) =>
    apiClient.delete<any>(`/transfers/${id}`),

  // Check-ins
  scan: (qrToken: string, eventId: string) =>
    apiClient.post<any>('/check-ins/scan', { qrToken, eventId }),

  checkInsByEvent: (eventId: string, page = 1) =>
    apiClient.get<any>(`/check-ins/event/${eventId}`, { params: { page } }),
}

// RSVP
export const rsvpApi = {
  create: (eventId: string) =>
    apiClient.post<any>(`/registrations/${eventId}/rsvp`),

  cancel: (eventId: string) =>
    apiClient.delete<any>(`/registrations/${eventId}/rsvp`),

  myRsvps: () =>
    apiClient.get<any>('/registrations/my'),
}

// Notifications
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<any>('/notifications', { params }),

  markRead: (id: string) =>
    apiClient.patch<any>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<any>('/notifications/read-all'),
}
