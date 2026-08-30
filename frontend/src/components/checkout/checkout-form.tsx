'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Tag, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import { validatePromoCode } from '@/services/promo-codes'
import Image from 'next/image'

interface CheckoutFormProps {
  event: {
    id: string
    title: string
    start_time: string
    location: string
    image_url: string | null
  }
  ticketType: {
    id: string
    name: string
    price: number
    description: string | null
  }
  quantity: number
  userId: string
  waitlistId?: string
  onCheckout: (paymentIntentId: string) => Promise<void>
}

export function CheckoutForm({ event, ticketType, quantity, userId, waitlistId, onCheckout }: CheckoutFormProps) {
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [promoStatus, setPromoStatus] = useState<'valid' | 'invalid' | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const subtotal = ticketType.price * quantity
  const total = subtotal - discountAmount

  async function handleValidatePromo() {
    if (!promoCode.trim()) return

    setIsValidatingPromo(true)
    setPromoStatus(null)

    try {
      const result = await validatePromoCode(event.id, ticketType.id, promoCode)

      if (result.valid) {
        setPromoStatus('valid')
        setDiscountAmount(result.discountAmount || 0)
      } else {
        setPromoStatus('invalid')
        setDiscountAmount(0)
      }
    } catch {
      setPromoStatus('invalid')
      setDiscountAmount(0)
    } finally {
      setIsValidatingPromo(false)
    }
  }

  async function handleCheckout() {
    setIsProcessing(true)

    try {
      const result = await onCheckout(promoCode)

      if (result.success && result.url) {
        // Redirect to Chapa Checkout
        window.location.href = result.url
      } else {
        alert(result.error || 'Checkout failed')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('[CheckoutForm]:', error)
      alert('An error occurred')
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
      {/* Event Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image src={event.image_url} alt={event.title} fill className="object-cover" />
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(event.start_time)} at {formatTime(event.start_time)}
            </p>
            <p className="text-sm text-muted-foreground">{event.location}</p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between mb-2">
              <span>{ticketType.name}</span>
              <Badge variant="secondary">{quantity}x</Badge>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 mb-2">
                <span>Discount ({promoCode})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Promo Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Promo Code (Optional)</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value)
                  setPromoStatus(null)
                  setDiscountAmount(0)
                }}
                disabled={isProcessing || isValidatingPromo}
              />
              <Button
                variant="outline"
                onClick={handleValidatePromo}
                disabled={!promoCode.trim() || isProcessing || isValidatingPromo}
              >
                {isValidatingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
              </Button>
            </div>

            {promoStatus === 'valid' && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Promo code applied!
              </p>
            )}

            {promoStatus === 'invalid' && (
              <p className="text-sm text-destructive">Invalid or expired promo code</p>
            )}
          </div>

          {/* Checkout Button */}
          <Button className="w-full" onClick={handleCheckout} disabled={isProcessing} size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(total)}`
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Secure payment powered by Chapa</p>
            <p>You will not be charged until you complete the checkout process</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
