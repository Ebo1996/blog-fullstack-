'use client'

import { useActionState, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { ActionResult } from '@/app/organizer/events/actions'
import type { TicketType } from '@/types/database'

interface TicketTypeFormProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  ticketType?: Partial<TicketType>
  onClose: () => void
  submitLabel?: string
}

export function TicketTypeForm({
  action,
  ticketType,
  onClose,
  submitLabel = 'Add ticket type',
}: TicketTypeFormProps) {
  const [state, formAction, pending] = useActionState(action, {})
  const [isFree, setIsFree] = useState((ticketType?.price ?? 0) === 0)

  // Close on success
  if (state.success) {
    onClose()
    return null
  }

  return (
    <form action={formAction} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {state.error && <Alert variant="error">{state.error}</Alert>}

      {/* Name */}
      <div className="form-group">
        <label className="form-label required" htmlFor="tt-name">Ticket name</label>
        <input
          id="tt-name" name="name" type="text" required
          className="form-input" placeholder="e.g. General Admission"
          defaultValue={ticketType?.name ?? ''}
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label" htmlFor="tt-desc">Description <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span></label>
        <input
          id="tt-desc" name="description" type="text"
          className="form-input" placeholder="What's included?"
          defaultValue={ticketType?.description ?? ''}
          maxLength={500}
        />
      </div>

      {/* Price */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label required" htmlFor="tt-price">Price</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--muted-foreground)', fontSize: 13, pointerEvents: 'none',
            }}>
              $
            </span>
            <input
              id="tt-price" name="price" type="number" required
              className="form-input" placeholder="0.00"
              min={0} step={0.01} max={100000}
              defaultValue={ticketType ? (ticketType.price! / 100).toFixed(2) : '0.00'}
              onChange={(e) => setIsFree(Number(e.target.value) === 0)}
              style={{ paddingLeft: 28 }}
            />
          </div>
          {isFree && (
            <p className="form-hint" style={{ color: 'var(--success)' }}>Free ticket — no payment required</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tt-currency">Currency</label>
          <select id="tt-currency" name="currency" className="form-select"
            defaultValue={ticketType?.currency ?? 'USD'}>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="CAD">CAD — Canadian Dollar</option>
            <option value="AUD">AUD — Australian Dollar</option>
          </select>
        </div>
      </div>

      {/* Quantity */}
      <div className="form-group" style={{ maxWidth: 200 }}>
        <label className="form-label required" htmlFor="tt-qty">Quantity available</label>
        <input
          id="tt-qty" name="quantity" type="number" required
          className="form-input" placeholder="100"
          min={1} max={100000}
          defaultValue={ticketType?.quantity ?? ''}
        />
      </div>

      {/* Sales window */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="tt-start">Sales start <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span></label>
          <input
            id="tt-start" name="sales_start_at" type="datetime-local"
            className="form-input"
            defaultValue={ticketType?.sales_start_at?.slice(0, 16) ?? ''}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tt-end">Sales end <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span></label>
          <input
            id="tt-end" name="sales_end_at" type="datetime-local"
            className="form-input"
            defaultValue={ticketType?.sales_end_at?.slice(0, 16) ?? ''}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <Button type="submit" loading={pending} style={{ flex: 1 }}>
          {submitLabel}
        </Button>
        <button type="button" className="button button-outline" onClick={onClose}>
          <X size={14} aria-hidden="true" /> Cancel
        </button>
      </div>
    </form>
  )
}
