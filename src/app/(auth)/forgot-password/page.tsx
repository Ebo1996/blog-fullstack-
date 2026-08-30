'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { forgotPasswordAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {})
  const sent = !pending && !state.error && state !== undefined && Object.keys(state).length === 0

  // Once submitted successfully, show confirmation UI
  const hasSubmitted = sent

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">N</span>
          northstar
        </div>

        {hasSubmitted ? (
          // ─── Sent confirmation ───────────────────────────────────────────
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                margin: '0 auto 20px',
              }}
            >
              <Mail size={24} />
            </div>
            <h1 className="auth-title" style={{ marginBottom: 8 }}>Check your inbox</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
              If an account exists for that email address, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="button button-outline"
              style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 12 }}
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          // ─── Request form ────────────────────────────────────────────────
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              Enter your email and we&apos;ll send you a reset link.
            </p>

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

              <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 4 }}>
                Send reset link
              </Button>
            </form>

            <div className="auth-footer">
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <ArrowLeft size={12} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
