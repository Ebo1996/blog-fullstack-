'use client'

import { useTransition, useState } from 'react'
import { CheckCircle, EyeOff, XCircle, Trash2 } from 'lucide-react'
import {
  setEventStatusAction,
  deleteEventAction,
} from '@/app/organizer/events/actions'
import type { EventStatus } from '@/types/database'

interface EventStatusActionsProps {
  eventId: string
  currentStatus: EventStatus
  isDraft: boolean
  isPublished: boolean
  isPast: boolean
}

export function EventStatusActions({
  eventId,
  currentStatus,
  isDraft,
  isPublished,
}: EventStatusActionsProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function act(status: EventStatus) {
    setError(null)
    startTransition(async () => {
      const result = await setEventStatusAction(eventId, status)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startTransition(async () => {
      await deleteEventAction(eventId)
    })
  }

  if (currentStatus === 'cancelled' || currentStatus === 'completed') {
    return null
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {error && (
        <span style={{ fontSize: 11, color: 'var(--error)' }} role="alert">{error}</span>
      )}

      {isDraft && (
        <>
          {/* Publish */}
          <button
            className="button button-primary button-sm"
            style={{ gap: 6, fontSize: 12 }}
            onClick={() => act('published')}
            disabled={pending}
            aria-busy={pending}
          >
            <CheckCircle size={13} aria-hidden="true" />
            {pending ? 'Publishing…' : 'Publish'}
          </button>

          {/* Delete draft */}
          <button
            className="button button-sm"
            style={{
              background: confirmDelete ? 'var(--error-bg)' : 'var(--muted)',
              color: confirmDelete ? 'var(--error)' : 'var(--foreground)',
              border: '1px solid',
              borderColor: confirmDelete ? 'var(--error)' : 'transparent',
              gap: 5, fontSize: 12,
            }}
            onClick={handleDelete}
            disabled={pending}
            aria-label={confirmDelete ? 'Click again to confirm delete' : 'Delete draft event'}
          >
            <Trash2 size={12} aria-hidden="true" />
            {confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>
        </>
      )}

      {isPublished && (
        <>
          {/* Unpublish */}
          <button
            className="button button-outline button-sm"
            style={{ gap: 6, fontSize: 12 }}
            onClick={() => act('draft')}
            disabled={pending}
            aria-busy={pending}
          >
            <EyeOff size={13} aria-hidden="true" />
            {pending ? 'Unpublishing…' : 'Unpublish'}
          </button>

          {/* Cancel */}
          <button
            className="button button-sm"
            style={{
              background: 'var(--error-bg)', color: 'var(--error)',
              border: '0', gap: 5, fontSize: 12,
            }}
            onClick={() => act('cancelled')}
            disabled={pending}
            aria-busy={pending}
          >
            <XCircle size={13} aria-hidden="true" />
            Cancel event
          </button>
        </>
      )}
    </div>
  )
}
