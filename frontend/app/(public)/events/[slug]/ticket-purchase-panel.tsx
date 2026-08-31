'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ordersApi } from '@/lib/api/orders'
import { useAuth } from '@/lib/auth-context'
import { formatCurrency, formatDate } from '@/lib/utils'

interface TicketType {
  _id: string
  name: string
  description?: string
  price: number
  currency: string
  quantity: number
  soldQuantity: number
  availableQuantity: number
  status: string
  salesStartAt?: string
  salesEndAt?: string
  minPerOrder: number
  maxPerOrder: number
}

interface Props {
  event: any
  ticketTypes: TicketType[]
  canPurchase: boolean
}

export function TicketPurchasePanel({ event, ticketTypes, canPurchase }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const availableTypes = ticketTypes.filter(
    (tt) => tt.status === 'active' && tt.availableQuantity > 0
  )

  const updateQty = (ttId: string, delta: number, tt: TicketType) => {
    setQuantities((prev) => {
      const current = prev[ttId] ?? 0
      const next = Math.max(0, Math.min(tt.maxPerOrder, current + delta))
      const updated = { ...prev, [ttId]: next }
      if (updated[ttId] === 0) delete updated[ttId]
      return updated
    })
  }

  const subtotal = ticketTypes.reduce((sum, tt) => {
    return sum + (quantities[tt._id] ?? 0) * tt.price
  }, 0)

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0)

  const handlePurchase = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${event.slug}`)
      return
    }

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))

    if (items.length === 0) {
      toast.error('Please select at least one ticket')
      return
    }

    setLoading(true)
    try {
      const res = await ordersApi.create(event._id, items)
      const { checkoutUrl } = res.data
      // Redirect to Chapa checkout
      window.location.href = checkoutUrl
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to create order. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!canPurchase) {
    return (
      <div className="panel space-y-4 text-center py-8">
        <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5 text-[var(--muted-foreground)]" />
        </div>
        <p className="text-sm font-medium">Tickets unavailable</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          This event is no longer accepting ticket purchases.
        </p>
      </div>
    )
  }

  if (ticketTypes.length === 0) {
    return (
      <div className="panel py-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">No tickets available yet.</p>
      </div>
    )
  }

  return (
    <div className="panel space-y-5">
      <div>
        <h2 className="font-semibold text-sm">Tickets</h2>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          {formatDate(event.startAt, 'EEEE, MMM d, yyyy')}
        </p>
      </div>

      <div className="space-y-3">
        {ticketTypes.map((tt) => {
          const qty = quantities[tt._id] ?? 0
          const isUnavailable = tt.status !== 'active' || tt.availableQuantity <= 0

          return (
            <div key={tt._id} className={`rounded-[var(--radius-md)] border p-4 transition-colors ${isUnavailable ? 'border-[var(--border)] opacity-60' : 'border-[var(--border)] hover:border-[var(--primary)]'} ${qty > 0 ? 'border-[var(--primary)] bg-[rgba(215,243,106,0.04)]' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{tt.name}</p>
                    {isUnavailable && <Badge variant="neutral">Sold out</Badge>}
                    {!isUnavailable && tt.availableQuantity <= 10 && (
                      <Badge variant="warning" dot>{tt.availableQuantity} left</Badge>
                    )}
                  </div>
                  {tt.description && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{tt.description}</p>
                  )}
                  <p className="text-sm font-bold mt-2" style={{ color: 'var(--primary)' }}>
                    {tt.price === 0 ? 'Free' : formatCurrency(tt.price, tt.currency)}
                  </p>
                </div>

                {/* Quantity stepper */}
                {!isUnavailable && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQty(tt._id, -1, tt)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(tt._id, 1, tt)}
                      disabled={qty >= tt.maxPerOrder || qty >= tt.availableQuantity}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Order summary */}
      {totalItems > 0 && (
        <div className="border-t border-[var(--border)] pt-4 space-y-2">
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>{totalItems} ticket{totalItems !== 1 ? 's' : ''}</span>
            <span>{formatCurrency(subtotal, event.currency ?? 'ETB')}</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>Platform fee (2.5%)</span>
            <span>{formatCurrency(subtotal * 0.025, event.currency ?? 'ETB')}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-[var(--border)]">
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>
              {formatCurrency(subtotal * 1.025, event.currency ?? 'ETB')}
            </span>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handlePurchase}
        loading={loading}
        disabled={totalItems === 0}
      >
        <ShoppingCart className="w-4 h-4" />
        {user ? (totalItems === 0 ? 'Select tickets' : 'Continue to payment') : 'Sign in to purchase'}
      </Button>

      <p className="text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        Secure payment via Chapa
      </p>
    </div>
  )
}
