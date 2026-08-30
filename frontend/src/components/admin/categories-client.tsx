'use client'

import { useState, useTransition, useActionState } from 'react'
import { Plus, Edit, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { EventCategory } from '@/types/database'
import type { AdminActionResult } from '@/app/admin/actions'

interface CategoriesClientProps {
  categories: EventCategory[]
  createAction: (prev: AdminActionResult, fd: FormData) => Promise<AdminActionResult>
  updateAction: (id: string, prev: AdminActionResult, fd: FormData) => Promise<AdminActionResult>
  deleteAction: (id: string) => Promise<AdminActionResult>
}

export function CategoriesClient({
  categories,
  createAction,
  updateAction,
  deleteAction,
}: CategoriesClientProps) {
  const [showCreate, setShowCreate]   = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletePending, startDelete]  = useTransition()

  function handleDelete(id: string) {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    setDeleteError(null)
    startDelete(async () => {
      const res = await deleteAction(id)
      if (res.error) { setDeleteError(res.error) }
      setConfirmDeleteId(null)
    })
  }

  return (
    <div>
      {deleteError && (
        <Alert variant="error" style={{ marginBottom: 16 }}>
          <AlertCircle size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
          {deleteError}
        </Alert>
      )}

      {/* Existing categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}
          >
            {/* Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>{cat.name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                  /{cat.slug}
                  {cat.description && ` · ${cat.description}`}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="button button-outline button-sm"
                  style={{ gap: 5, fontSize: 11 }}
                  onClick={() => setEditingId(editingId === cat.id ? null : cat.id)}
                  aria-expanded={editingId === cat.id}
                  aria-label={`Edit ${cat.name}`}
                >
                  {editingId === cat.id
                    ? <><X size={12} aria-hidden="true" /> Close</>
                    : <><Edit size={12} aria-hidden="true" /> Edit</>
                  }
                </button>
                <button
                  className="button button-sm"
                  style={{
                    background: confirmDeleteId === cat.id ? 'var(--error-bg)' : 'var(--muted)',
                    color:      confirmDeleteId === cat.id ? 'var(--error)' : 'var(--foreground)',
                    border:     confirmDeleteId === cat.id ? '1px solid var(--error)' : '0',
                    gap: 5, fontSize: 11, cursor: 'pointer',
                  }}
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletePending}
                  aria-label={confirmDeleteId === cat.id ? `Confirm delete ${cat.name}` : `Delete ${cat.name}`}
                >
                  <Trash2 size={12} aria-hidden="true" />
                  {confirmDeleteId === cat.id ? 'Confirm' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === cat.id && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)', paddingTop: 16, background: 'var(--muted)' }}>
                <p className="eyebrow" style={{ marginBottom: 14 }}>EDIT CATEGORY</p>
                <CategoryForm
                  action={(prev, fd) => updateAction(cat.id, prev, fd)}
                  defaultValues={{ name: cat.name, description: cat.description ?? '' }}
                  submitLabel="Save changes"
                  onSuccess={() => setEditingId(null)}
                />
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div
            style={{
              border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '40px 24px', textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, margin: '0 0 6px' }}>
              No categories yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
              Categories appear on event pages and in the discovery filters.
            </p>
          </div>
        )}
      </div>

      {/* Create form / button */}
      {showCreate ? (
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <p className="eyebrow">NEW CATEGORY</p>
            <button
              onClick={() => setShowCreate(false)}
              aria-label="Close create form"
              style={{ background: 'none', border: 0, color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <CategoryForm
            action={createAction}
            submitLabel="Create category"
            onSuccess={() => setShowCreate(false)}
          />
        </div>
      ) : (
        <button
          className="button button-outline"
          style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={15} aria-hidden="true" />
          Add category
        </button>
      )}
    </div>
  )
}

// ─── Reusable form ────────────────────────────────────────────────────────────

interface CategoryFormProps {
  action: (prev: AdminActionResult, fd: FormData) => Promise<AdminActionResult>
  defaultValues?: { name?: string; description?: string }
  submitLabel?: string
  onSuccess?: () => void
}

function CategoryForm({
  action,
  defaultValues,
  submitLabel = 'Save',
  onSuccess,
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  // Trigger onSuccess when state becomes success
  const [hasTriggered, setHasTriggered] = useState(false)
  if (state.success && onSuccess && !hasTriggered) {
    setHasTriggered(true)
    onSuccess()
  }

  return (
    <form
      action={formAction}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div className="form-row-2col">
        <div className="form-group">
          <label className="form-label required" htmlFor="cat-name">Name</label>
          <input
            id="cat-name" name="name" type="text" required
            className="form-input" placeholder="e.g. Technology"
            defaultValue={defaultValues?.name ?? ''}
            maxLength={80}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="cat-desc">Description</label>
          <input
            id="cat-desc" name="description" type="text"
            className="form-input" placeholder="Short description (optional)"
            defaultValue={defaultValues?.description ?? ''}
            maxLength={300}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button type="submit" loading={pending} style={{ gap: 7 }}>
          <Check size={14} aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
