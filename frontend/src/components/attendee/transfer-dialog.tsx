'use client'

import { useState, useTransition } from 'react'
import { Send, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { createTransferAction } from '@/app/dashboard/transfers/actions'

interface TransferButtonProps {
  ticketId: string
  eventTitle: string
}

export function TransferButton({ ticketId, eventTitle }: TransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter a valid email')
      return
    }

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await createTransferAction(ticketId, email.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setEmail('')
        setSuccess(false)
      }, 2000)
    })
  }

  function handleClose() {
    if (pending) return
    setIsOpen(false)
    setEmail('')
    setError(null)
    setSuccess(false)
  }

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="button button-outline"
        style={{ gap: 7 }}
      >
        <Send size={14} aria-hidden="true" />
        Transfer ticket
      </button>

      {/* Dialog */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 50,
              animation: 'fadeIn 0.2s',
            }}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            role="dialog"
            aria-labelledby="transfer-title"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              width: '90%',
              maxWidth: 480,
              padding: 24,
              animation: 'slideUp 0.2s',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2
                  id="transfer-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    fontWeight: 400,
                    margin: '0 0 4px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Transfer ticket
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
                  {eventTitle}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={pending}
                aria-label="Close dialog"
                style={{
                  background: 'none',
                  border: 0,
                  color: 'var(--muted-foreground)',
                  cursor: pending ? 'not-allowed' : 'pointer',
                  padding: 4,
                  opacity: pending ? 0.5 : 1,
                }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <Alert variant="error" style={{ marginBottom: 16 }}>
                  <AlertCircle size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" style={{ marginBottom: 16 }}>
                  Transfer sent! Redirecting…
                </Alert>
              )}

              <div className="form-group">
                <label htmlFor="transfer-email" className="form-label required">
                  Recipient email
                </label>
                <input
                  id="transfer-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="form-input"
                  disabled={pending || success}
                  autoFocus
                />
                <span className="form-help">
                  They must have an account on this platform.
                </span>
              </div>

              <div className="form-notice" style={{ marginTop: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
                  The recipient will receive a notification and have 7 days to accept.
                  You can cancel the transfer before they accept.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending || success}
                  className="button button-muted"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={pending}
                  disabled={success}
                  style={{ gap: 7 }}
                >
                  <Send size={14} aria-hidden="true" />
                  {pending ? 'Sending…' : 'Send transfer'}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
