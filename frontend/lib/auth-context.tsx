'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { authApi, User } from './api/auth'
import { setAccessToken } from './api/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (u: User | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (storedToken) {
        setAccessToken(storedToken)
        const res = await authApi.me()
        setUser(res.data)
      }
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setAccessToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { accessToken, refreshToken, user: u } = res.data
    setAccessToken(accessToken)
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    setAccessToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
