'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { resetPasswordAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPasswordAction, {})

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">N</span>
          northstar
        </div>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">
          Choose a strong password for your account.
        </p>

        {state.error && (
          <Alert variant="error" className="mb-4">
            {state.error}
          </Alert>
        )}

        <form action={action} className="auth-form" noValidate>
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            hint="Min 8 characters, one uppercase, one number"
          />

          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />

          <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 4 }}>
            Update password
          </Button>
        </form>

        <div className="auth-footer">
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ArrowLeft size={12} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
