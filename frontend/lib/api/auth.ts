import apiClient from './client'

export interface RegisterDto {
  name: string
  email: string
  password: string
  role?: 'attendee' | 'organizer'
}

export interface LoginDto {
  email: string
  password: string
}

export interface User {
  _id: string
  name: string
  email: string
  role: 'attendee' | 'organizer' | 'admin'
  image?: string
  bio?: string
  phoneNumber?: string
  emailVerified: boolean
  createdAt: string
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: User
}

export const authApi = {
  register: (data: RegisterDto) =>
    apiClient.post<AuthResult>('/auth/register', data),

  login: (data: LoginDto) =>
    apiClient.post<AuthResult>('/auth/login', data),

  logout: () =>
    apiClient.post('/auth/logout', {}),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  me: () =>
    apiClient.get<User>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    apiClient.get(`/auth/verify-email?token=${token}`),

  updateMe: (data: Partial<User>) =>
    apiClient.patch<User>('/users/me', data),

  googleAuth: (credential: string, role: 'attendee' | 'organizer' = 'attendee') =>
    apiClient.post<AuthResult>('/auth/google', { credential, role }),
}
