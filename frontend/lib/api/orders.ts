import apiClient from './client'

export interface OrderItem {
  ticketTypeId: string
  quantity: number
}

export const ordersApi = {
  create: (eventId: string, items: OrderItem[]) =>
    apiClient.post<any>('/orders', { eventId, items }),

  list: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<any>('/orders', { params }),

  get: (id: string) =>
    apiClient.get<any>(`/orders/${id}`),

  cancel: (id: string) =>
    apiClient.delete<any>(`/orders/${id}`),

  eventOrders: (eventId: string, params?: any) =>
    apiClient.get<any>(`/orders/event/${eventId}`, { params }),

  getByEvent: (eventId: string, params?: any) =>
    apiClient.get<any>(`/orders/event/${eventId}`, { params }),

  // Admin
  adminList: (params?: any) =>
    apiClient.get<any>('/admin/orders', { params }),
}

export const paymentsApi = {
  verify: (txRef: string) =>
    apiClient.post<any>(`/payments/chapa/verify/${txRef}`),
}
