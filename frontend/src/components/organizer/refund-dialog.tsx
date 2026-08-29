'use client'

import { useState, useTransition } from 'react'
import { DollarSign, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/format'
import type { RefundActionResult } from '@/app/organizer/events/[eventId]/orders/[orderId]/actions'

interface RefundDialogProps {
  orderId: string
  eventId: string
  maxAmount: number
  currency: string
  refundAction: (
    orderId: string,
    eventId: string,
    amount: number,
    reason: string,
  ) => Promise<RefundActionResult>
}

export function RefundDialog({
  orderId,
  eventId,
  maxAmount,
  currency,
  refundAction,
}: RefundDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState(maxAmount)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const isFullRefund = amount >= maxAmount
  const amountInDollars = amount / 100

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (amount <= 0 || amount > maxAmount) {
      setError(`Amount must be between $0.01 and ${formatCurrency(maxAmount, currency)}`)
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund')
      return
    }

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await refundAction(orderId, eventId, amount, reason.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setAmount(maxAmount)
        setReason('')
        setSuccess(false)
      }, 2000)
    })
  }

  function handleClose() {
    if (pending) return
    setIsOpen(false)
    setAmount(maxAmount)
    setReason('')
    setError(null)
    setSuccess(false)
  }

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="button button-outline"
        style={{ gap: 7, color: 'var(--error)', borderColor: 'var(--error)' }}
      >
        <DollarSign size={14} aria-hidden="true" />
        Issue refund
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
            aria-labelledby="refund-title"
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
              maxWidth: 520,
              padding: 24,
              animation: 'slideUp 0.2s',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2
                  id="refund-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    fontWeight: 400,
                    margin: '0 0 4px',
                    letterSpacing: '-0.01em',
                    color: 'var(--error)',
                  }}
                >
                  Issue refund
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
                  Maximum refundable: {formatCurrency(maxAmount, currency)}
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
                  Refund processed successfully! Redirecting…
                </Alert>
              )}

              {/* Amount */}
              <div className="form-group">
                <label htmlFor="refund-amount" className="form-label required">
                  Refund amount ({currency.toUpperCase()})
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--muted-foreground)',
                      fontSize: 14,
                      pointerEvents: 'none',
                    }}
                  >
                    $
                  </span>
                  <input
                    id="refund-amount"
                    type="number"
                    required
                    min="0.01"
                    max={amountInDollars}
                    step="0.01"
                    value={amountInDollars}
                    onChange={(e) => setAmount(Math.round(parseFloat(e.target.value || '0') * 100))}
                    className="form-input"
                    style={{ paddingLeft: 32 }}
                    disabled={pending || success}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(maxAmount / 2))}
                    disabled={pending || success}
                    className="button button-muted button-sm"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(maxAmount)}
                    disabled={pending || success}
                    className="button button-muted button-sm"
                  >
                    Full refund
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label htmlFor="refund-reason" className="form-label required">
                  Reason for refund
                </label>
                <textarea
                  id="refund-reason"
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Event cancelled, customer request, etc."
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: 80 }}
                  disabled={pending || success}
                  maxLength={500}
                />
                <span className="form-help">
                  This will be recorded in the audit log. {reason.length}/500 characters.
                </span>
              </div>

              {/* Warning */}
              <div
                style={{
                  background: 'var(--error-bg)',
                  border: '1px solid rgba(224,107,107,0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginTop: 16,
                  marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--error)', margin: 0, lineHeight: 1.6 }}>
                  <strong>Warning:</strong> This will process a {isFullRefund ? 'full' : 'partial'} refund through Stripe.
                  {isFullRefund && ' All associated tickets will be cancelled.'}
                  {' '}This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
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
                  style={{
                    gap: 7,
                    background: 'var(--error)',
                    borderColor: 'var(--error)',
                  }}
                >
                  <DollarSign size={14} aria-hidden="true" />
                  {pending ? 'Processing…' : isFullRefund ? 'Issue full refund' : 'Issue partial refund'}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
