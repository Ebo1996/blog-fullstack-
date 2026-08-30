'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Mail } from 'lucide-react'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, { error: undefined })

  // ── Email sent — show confirmation screen ──────────────────────────────────
  if (state.success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            display: 'grid', placeItems: 'center',
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(215,243,106,0.12)', color: 'var(--primary)',
            margin: '0 auto 24px',
          }}>
            <Mail size={28} aria-hidden="true" />
          </div>

          <h1 className="auth-title" style={{ marginBottom: 8 }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            We sent a verification link to your email address.<br />
            Click the link to activate your <strong>Eventify Ethiopia</strong> account.
          </p>

          <div style={{
            background: 'var(--muted)', borderRadius: 10,
            padding: '14px 18px', marginBottom: 24,
            fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6,
            textAlign: 'left',
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--foreground)' }}>
              Didn&apos;t receive it?
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>The link expires in 24 hours</li>
            </ul>
          </div>

          <Link
            href="/login"
            className="button button-outline"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Register form ──────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span style={{ fontSize: 20 }}>🎟️</span>
          Eventify Ethiopia
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          Join thousands of people discovering events in Ethiopia.
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
            placeholder="Abebe Girma"
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
