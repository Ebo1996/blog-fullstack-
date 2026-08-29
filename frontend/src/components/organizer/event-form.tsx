'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { ActionResult } from '@/app/organizer/events/actions'
import type { EventCategory } from '@/types/database'
import type { EventFull } from '@/types'

interface EventFormProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  categories: EventCategory[]
  /** Pre-populated values for edit mode */
  event?: Partial<EventFull>
  submitLabel?: string
}

// Convert DB datetime string (2025-10-18T20:00:00+00:00) → datetime-local value
function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16) // YYYY-MM-DDTHH:MM
}

export function EventForm({
  action,
  categories,
  event,
  submitLabel = 'Create event',
}: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {state.error && (
        <Alert variant="error">{state.error}</Alert>
      )}
      {state.success && (
        <Alert variant="success">Event saved successfully.</Alert>
      )}

      {/* ── Basic info ──────────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
          Basic information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label required" htmlFor="ef-title">Event title</label>
            <input
              id="ef-title" name="title" type="text" required
              className="form-input" placeholder="e.g. Future Sound 2025"
              defaultValue={event?.title ?? ''}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="ef-description">Description</label>
            <textarea
              id="ef-description" name="description" required
              className="form-textarea" rows={5}
              placeholder="Tell attendees what your event is about…"
              defaultValue={event?.description ?? ''}
              maxLength={10000}
            />
          </div>

          <div className="form-group">
            <label className="form-label required" htmlFor="ef-category">Category</label>
            <select
              id="ef-category" name="category_id" required
              className="form-select"
              defaultValue={event?.category_id ?? ''}
            >
              <option value="" disabled>Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Date & time ─────────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
          Date &amp; time
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label required" htmlFor="ef-start">Start date &amp; time</label>
            <input
              id="ef-start" name="start_at" type="datetime-local" required
              className="form-input"
              defaultValue={toDatetimeLocal(event?.start_at)}
            />
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="ef-end">End date &amp; time</label>
            <input
              id="ef-end" name="end_at" type="datetime-local" required
              className="form-input"
              defaultValue={toDatetimeLocal(event?.end_at)}
            />
          </div>
        </div>
      </section>

      {/* ── Venue ───────────────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
          Venue
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label required" htmlFor="ef-venue">Venue name</label>
            <input
              id="ef-venue" name="venue_name" type="text" required
              className="form-input" placeholder="e.g. Brooklyn Mirage"
              defaultValue={event?.venue_name ?? ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="ef-address">Street address</label>
            <input
              id="ef-address" name="venue_address" type="text" required
              className="form-input" placeholder="e.g. 140 Stewart Ave"
              defaultValue={event?.venue_address ?? ''}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label required" htmlFor="ef-city">City</label>
              <input
                id="ef-city" name="city" type="text" required
                className="form-input" placeholder="e.g. Brooklyn"
                defaultValue={event?.city ?? ''}
              />
            </div>
            <div className="form-group">
              <label className="form-label required" htmlFor="ef-country">Country</label>
              <input
                id="ef-country" name="country" type="text" required
                className="form-input" placeholder="e.g. US"
                defaultValue={event?.country ?? ''}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Capacity ────────────────────────────────────────── */}
      <section>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
          Capacity
        </h3>
        <div className="form-group">
          <label className="form-label" htmlFor="ef-capacity">Max attendees</label>
          <input
            id="ef-capacity" name="capacity" type="number"
            className="form-input" placeholder="Leave blank for unlimited"
            min={1} max={100000}
            defaultValue={event?.capacity ?? ''}
            style={{ maxWidth: 200 }}
          />
          <p className="form-hint">Leave blank for unlimited capacity.</p>
        </div>
      </section>

      {/* Hidden datetime fix — datetime-local doesn't include timezone offset */}
      {/* We handle this in the server action by treating as UTC */}

      {/* Submit */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <Button type="submit" loading={pending} style={{ minWidth: 160 }}>
          {submitLabel}
        </Button>
        <a href="/organizer/events" className="button button-outline">
          Cancel
        </a>
      </div>
    </form>
  )
}
