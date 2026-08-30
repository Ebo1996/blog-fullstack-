'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Copy, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { PromoCode, CreatePromoCodeInput } from '@/services/promo-codes'
import { PromoCodeDialog } from './promo-code-dialog'

interface PromoCodesManagerProps {
  eventId: string
  promoCodes: PromoCode[]
  onCreateCode: (eventId: string, input: CreatePromoCodeInput) => Promise<{ success: boolean; error?: string }>
  onUpdateCode: (
    eventId: string,
    promoCodeId: string,
    updates: Partial<{
      valid_from: string
      valid_to: string
      usage_limit: number | null
      active: boolean
    }>,
  ) => Promise<{ success: boolean; error?: string }>
  onDeleteCode: (eventId: string, promoCodeId: string) => Promise<{ success: boolean; error?: string }>
}

export function PromoCodesManager({
  eventId,
  promoCodes,
  onCreateCode,
  onUpdateCode,
  onDeleteCode,
}: PromoCodesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggleActive = async (promoCode: PromoCode) => {
    await onUpdateCode(eventId, promoCode.id, { active: !promoCode.active })
  }

  const handleDelete = async (promoCodeId: string) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      await onDeleteCode(eventId, promoCodeId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {promoCodes.length} promo code{promoCodes.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Promo Code
        </Button>
      </div>

      {/* Promo Codes List */}
      {promoCodes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No promo codes created yet</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Promo Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promoCodes.map((code) => (
            <Card key={code.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono text-lg">{code.code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyCode(code.code)}
                        title="Copy code"
                      >
                        {copiedCode === code.code ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingCode(code)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(code.id)}
                      disabled={code.used_count > 0}
                      title={code.used_count > 0 ? 'Cannot delete used code' : 'Delete code'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Discount */}
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {code.discount_type === 'percentage'
                      ? `${code.discount_value}% OFF`
                      : `${formatCurrency(code.discount_value)} OFF`}
                  </div>
                  {code.max_discount && code.discount_type === 'percentage' && (
                    <div className="text-xs text-muted-foreground">
                      Max discount: {formatCurrency(code.max_discount)}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex gap-2">
                  <Badge variant={code.active ? 'success' : 'neutral'}>
                    {code.active ? 'Active' : 'Inactive'}
                  </Badge>
                  {code.usage_limit && (
                    <Badge variant="outline">
                      {code.used_count}/{code.usage_limit} used
                    </Badge>
                  )}
                  {!code.usage_limit && code.used_count > 0 && (
                    <Badge variant="outline">{code.used_count} used</Badge>
                  )}
                </div>

                {/* Details */}
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid from:</span>
                    <span>{formatDate(code.valid_from)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid until:</span>
                    <span>{formatDate(code.valid_to)}</span>
                  </div>
                  {code.min_tickets && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min tickets:</span>
                      <span>{code.min_tickets}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleActive(code)}
                  >
                    {code.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <PromoCodeDialog
        eventId={eventId}
        promoCode={editingCode}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingCode(null)
        }}
        onSave={onCreateCode}
      />
    </div>
  )
}
