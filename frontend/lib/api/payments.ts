import apiClient from './client'

export const paymentsApi = {
  /**
   * Called by the frontend after Chapa redirects back.
   * Backend re-verifies with Chapa server-side — never trusts frontend claim.
   */
  verify: (txRef: string) =>
    apiClient.post<any>(`/payments/chapa/verify/${txRef}`),

  /**
   * Get order status by checkout reference (used on payment success page).
   */
  getOrderByRef: (txRef: string) =>
    apiClient.get<any>('/orders', { params: { txRef } }),
}
