'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {})
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">N</span>
          northstar
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue.</p>

        {resetSuccess && (
          <Alert variant="success" className="mb-4">
            Password updated. Sign in with your new password.
          </Alert>
        )}

        {state.error && (
          <Alert variant="error" className="mb-4">
            {state.error}
          </Alert>
        )}

        <form action={action} className="auth-form" noValidate>
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <Link
                href="/forgot-password"
                style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 4 }}>
            Sign in
          </Button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
