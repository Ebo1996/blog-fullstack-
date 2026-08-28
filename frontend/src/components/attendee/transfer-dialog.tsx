'use client'

import { useState, useTransition } from 'react'
import { Users, X, ArrowRight, AlertCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

interface TransferDialogProps {
  ticketId: string
  eventTitle: string
  onSuccess?: () => void
}

export function TransferButton({ ticketId, eventTitle }: TransferDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/tickets/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, toEmail: email.trim() }),
        })
        const data = await res.json() as { success?: boolean; error?: string }
        if (!res.ok || !data.success) {
          setError(data.error ?? 'Transfer failed. Please try again.')
          return
        }
        setSuccess(true)
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        className="button button-outline"
        onClick={() => { setOpen(true); setSuccess(false); setError(null); setEmail('') }}
      >
        <Users size={14} aria-hidden="true" />
        Transfer ticket
      </button>

      {open && (
        /* Native <dialog> for accessibility */
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-dialog-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as never,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: 'relative', zIndex: 1,
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: 32,
              width: '100%', maxWidth: 420,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2
                  id="transfer-dialog-title"
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, margin: '0 0 4px', letterSpacing: '-0.02em' }}
                >
                  Transfer ticket
                </h2>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
                  {eventTitle}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ background: 'none', border: 0, color: 'var(--muted-foreground)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    display: 'grid', placeItems: 'center',
                    width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                    background: 'var(--success-bg)', color: 'var(--success)',
                    margin: '0 auto 16px',
                  }}
                  aria-hidden="true"
                >
                  <Users size={24} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>Transfer sent</p>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  We&apos;ve sent a transfer request to <strong>{email}</strong>. They have 72 hours to accept.
                </p>
                <button
                  className="button button-outline"
                  style={{ width: '100%' }}
                  onClick={() => setOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <Alert variant="info" style={{ marginBottom: 20 }}>
                  The recipient has 72 hours to accept. Your ticket stays valid until they do.
                </Alert>

                {error && (
                  <Alert variant="error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={13} style={{ marginRight: 6, flexShrink: 0 }} aria-hidden="true" />
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="transfer-email">
                      Recipient&apos;s email address
                    </label>
                    <input
                      id="transfer-email"
                      type="email"
                      className="form-input"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <p className="form-hint">They must have a Northstar account.</p>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="button button-outline"
                      style={{ flex: 1 }}
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="button button-primary"
                      style={{ flex: 1, gap: 8 }}
                      disabled={isPending}
                      aria-busy={isPending}
                    >
                      {isPending ? 'Sending…' : (
                        <><ArrowRight size={14} aria-hidden="true" /> Send transfer</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
