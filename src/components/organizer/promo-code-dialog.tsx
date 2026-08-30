'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PromoCode, CreatePromoCodeInput } from '@/services/promo-codes'

interface PromoCodeDialogProps {
  eventId: string
  promoCode?: PromoCode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (eventId: string, input: CreatePromoCodeInput) => Promise<{ success: boolean; error?: string }>
}

export function PromoCodeDialog({ eventId, promoCode, open, onOpenChange, onSave }: PromoCodeDialogProps) {
  const [formData, setFormData] = useState<CreatePromoCodeInput>({
    event_id: eventId,
    code: promoCode?.code || '',
    discount_type: promoCode?.discount_type || 'percentage',
    discount_value: promoCode?.discount_value || 10,
    valid_from: promoCode?.valid_from
      ? new Date(promoCode.valid_from).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    valid_to: promoCode?.valid_to
      ? new Date(promoCode.valid_to).toISOString().slice(0, 16)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    usage_limit: promoCode?.usage_limit || null,
    min_tickets: promoCode?.min_tickets || null,
    max_discount: promoCode?.max_discount || null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await onSave(eventId, formData)
      if (result.success) {
        onOpenChange(false)
      } else {
        setError(result.error || 'Failed to save promo code')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {promoCode ? 'Edit Promo Code' : 'Create Promo Code'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2024"
                required
                pattern="[A-Z0-9_-]+"
                title="Only letters, numbers, dashes, and underscores"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alphanumeric characters, dashes, and underscores only
              </p>
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="percentage"
                    checked={formData.discount_type === 'percentage'}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' })}
                  />
                  Percentage
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="fixed"
                    checked={formData.discount_type === 'fixed'}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'fixed' })}
                  />
                  Fixed Amount
                </label>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) })}
                min={1}
                max={formData.discount_type === 'percentage' ? 100 : undefined}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.discount_type === 'percentage'
                  ? '1-100 (percent off)'
                  : 'Amount in cents (e.g., 500 = $5.00)'}
              </p>
            </div>

            {/* Max Discount (for percentage) */}
            {formData.discount_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium mb-1">Max Discount (optional)</label>
                <Input
                  type="number"
                  value={formData.max_discount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_discount: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="No limit"
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-1">Maximum discount in cents (e.g., 5000 = $50.00)</p>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valid From <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valid Until <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium mb-1">Usage Limit (optional)</label>
              <Input
                type="number"
                value={formData.usage_limit || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usage_limit: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Unlimited"
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum number of times this code can be used</p>
            </div>

            {/* Min Tickets */}
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Tickets (optional)</label>
              <Input
                type="number"
                value={formData.min_tickets || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_tickets: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="No minimum"
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum number of tickets required to use this code
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Saving...' : promoCode ? 'Update Code' : 'Create Code'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
