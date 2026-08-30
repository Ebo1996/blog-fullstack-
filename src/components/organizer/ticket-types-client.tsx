'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { TicketTypeForm } from './ticket-type-form'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import type { TicketType } from '@/types/database'
import type { ActionResult } from '@/app/organizer/events/actions'

interface TicketTypesClientProps {
  eventId: string
  ticketTypes: TicketType[]
  createAction: (prev: ActionResult, fd: FormData) => Promise<ActionResult>
  updateAction: (ttId: string, prev: ActionResult, fd: FormData) => Promise<ActionResult>
  deleteAction: (ttId: string) => Promise<ActionResult>
  isPublished: boolean
}

export function TicketTypesClient({
  eventId: _eventId,
  ticketTypes,
  createAction,
  updateAction,
  deleteAction,
  isPublished,
}: TicketTypesClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletePending, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function handleDelete(ttId: string) {
    if (confirmDeleteId !== ttId) { setConfirmDeleteId(ttId); return }
    setDeleteError(null)
    startDelete(async () => {
      const res = await deleteAction(ttId)
      if (res.error) setDeleteError(res.error)
      setConfirmDeleteId(null)
    })
  }

  return (
    <div>
      {deleteError && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} aria-hidden="true" />
          {deleteError}
        </div>
      )}

      {/* Existing ticket types */}
      {ticketTypes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {ticketTypes.map((tt) => {
            const remaining  = tt.quantity - tt.sold_quantity
            const soldPct    = Math.round((tt.sold_quantity / tt.quantity) * 100)
            const isEditing  = editingId === tt.id

            return (
              <div
                key={tt.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {/* Row */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{tt.name}</p>
                      <Badge
                        variant={
                          tt.status === 'active' ? 'success' :
                          tt.status === 'sold_out' ? 'warning' : 'neutral'
                        }
                      >
                        {tt.status === 'active' ? 'Active' : tt.status === 'sold_out' ? 'Sold out' : 'Inactive'}
                      </Badge>
                    </div>
                    {tt.description && (
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 6px' }}>
                        {tt.description}
                      </p>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: tt.price === 0 ? 'var(--success)' : 'var(--foreground)' }}>
                      {tt.price === 0 ? 'Free' : formatCurrency(tt.price, tt.currency)}
                    </p>
                  </div>

                  {/* Inventory */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>
                      {formatNumber(tt.sold_quantity)} / {formatNumber(tt.quantity)}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                      {remaining} remaining
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="button button-outline button-sm"
                      style={{ gap: 5, fontSize: 11 }}
                      onClick={() => setEditingId(isEditing ? null : tt.id)}
                      aria-expanded={isEditing}
                      aria-label={`Edit ${tt.name}`}
                    >
                      <Edit size={12} aria-hidden="true" />
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                    {tt.sold_quantity === 0 && (
                      <button
                        className="button button-sm"
                        style={{
                          background: confirmDeleteId === tt.id ? 'var(--error-bg)' : 'var(--muted)',
                          color: confirmDeleteId === tt.id ? 'var(--error)' : 'var(--foreground)',
                          border: confirmDeleteId === tt.id ? '1px solid var(--error)' : '0',
                          gap: 5, fontSize: 11,
                        }}
                        onClick={() => handleDelete(tt.id)}
                        disabled={deletePending}
                        aria-label={confirmDeleteId === tt.id ? 'Confirm delete' : `Delete ${tt.name}`}
                      >
                        <Trash2 size={12} aria-hidden="true" />
                        {confirmDeleteId === tt.id ? 'Confirm' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 3,
                    background: 'var(--muted)',
                    borderTop: '1px solid var(--border)',
                  }}
                  role="progressbar"
                  aria-label={`${soldPct}% sold`}
                  aria-valuenow={soldPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(soldPct, 100)}%`,
                      background: soldPct >= 90
                        ? 'var(--warning)'
                        : soldPct >= 50
                          ? 'var(--organizer-accent)'
                          : 'var(--primary)',
                      transition: 'width var(--transition-slow)',
                    }}
                  />
                </div>

                {/* Edit form — inline expansion */}
                {isEditing && (
                  <div
                    style={{
                      padding: '20px',
                      borderTop: '1px solid var(--border)',
                      background: 'var(--muted)',
                    }}
                  >
                    <p className="eyebrow" style={{ marginBottom: 16 }}>EDIT TICKET TYPE</p>
                    <TicketTypeForm
                      action={(prev, fd) => updateAction(tt.id, prev, fd)}
                      ticketType={tt}
                      onClose={() => setEditingId(null)}
                      submitLabel="Save changes"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, margin: '0 0 8px' }}>
            No ticket types yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px' }}>
            Add at least one ticket type before publishing your event.
          </p>
        </div>
      )}

      {/* Create form */}
      {showCreate ? (
        <div className="panel">
          <p className="eyebrow" style={{ marginBottom: 16 }}>NEW TICKET TYPE</p>
          <TicketTypeForm
            action={createAction}
            onClose={() => setShowCreate(false)}
            submitLabel="Add ticket type"
          />
        </div>
      ) : (
        <button
          className="button button-outline"
          style={{ width: '100%', gap: 8, justifyContent: 'center' }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={15} aria-hidden="true" />
          Add ticket type
        </button>
      )}

      {/* Published warning */}
      {isPublished && ticketTypes.length > 0 && (
        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <AlertCircle size={14} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 12 }}>
            Price and quantity changes on published events will apply to new purchases only. Existing orders are not affected.
          </p>
        </div>
      )}
    </div>
  )
}
