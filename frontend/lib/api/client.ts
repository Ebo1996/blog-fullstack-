const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// In-memory token for client-side requests
let _accessToken: string | null = null
export function setAccessToken(token: string | null) { _accessToken = token }
export function getAccessToken() { return _accessToken }

interface RequestOptions {
  method?: string
  body?: any
  params?: Record<string, any>
  token?: string
  next?: { revalidate?: number }
  cache?: RequestCache
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T }> {
  const { method = 'GET', body, params, token, next, cache } = options

  // Build query string
  let url = `${API_URL}${endpoint}`
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  // Use provided token, or in-memory token, or localStorage
  const authToken = token ?? _accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null)
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(next ? { next } : {}),
    ...(cache ? { cache } : {}),
  }

  const res = await fetch(url, fetchOptions)
  const json = await res.json().catch(() => ({}))

  // If 401 and we have a refresh token, try to refresh
  if (res.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/')) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          const newAccessToken = refreshData.data?.accessToken || refreshData.accessToken
          const newRefreshToken = refreshData.data?.refreshToken || refreshData.refreshToken
          
          if (newAccessToken) {
            // Update tokens
            localStorage.setItem('accessToken', newAccessToken)
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)
            _accessToken = newAccessToken
            
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${newAccessToken}`
            const retryRes = await fetch(url, { ...fetchOptions, headers })
            const retryJson = await retryRes.json().catch(() => ({}))
            
            if (retryRes.ok) {
              return { data: retryJson.data ?? retryJson }
            }
          }
        }
      } catch (e) {
        // Refresh failed, let original error through
      }
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.code ?? 'UNKNOWN_ERROR',
      json.message ?? 'An error occurred',
      json.errors
    )
  }

  // Backend wraps responses in { success, data, ... }
  return { data: json.data ?? json }
}

const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  put: <T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

export default apiClient
