'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, {})

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">N</span>
          northstar
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          Join thousands of people discovering events.
        </p>

        {state.error && (
          <Alert variant="error" className="mb-4">
            {state.error}
          </Alert>
        )}

        <form action={action} className="auth-form" noValidate>
          <Input
            label="Full name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            placeholder="Jordan Davis"
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            hint="Min 8 characters, one uppercase, one number"
          />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />

          <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 4 }}>
            Create account
          </Button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          By creating an account you agree to our{' '}
          <Link href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>.
        </p>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
