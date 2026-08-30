'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  onCheckout: (input: {
    eventId: string
    eventTitle: string
    ticketTypeId: string
    ticketTypeName: string
    quantity: number
    pricePerTicket: number
    userId: string
    promoCodeId?: string
    discountAmount?: number
  }) => Promise<{ success: boolean; sessionId?: string; url?: string | null; error?: string }>
}

export function CheckoutForm({ event, ticketType, quantity, userId, waitlistId, onCheckout }: CheckoutFormProps) {
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [promoValidation, setPromoValidation] = useState<{
    valid: boolean
    promoCodeId: string | null
    discountAmount: number
    error: string | null
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const subtotal = ticketType.price * quantity
  const discount = promoValidation?.valid ? promoValidation.discountAmount : 0
  const total = subtotal - discount

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoValidation(null)
      return
    }

    setIsValidatingPromo(true)
    try {
      const result = await validatePromoCode(promoCode, event.id, quantity, subtotal)
      setPromoValidation(result)
    } catch (error) {
      setPromoValidation({
        valid: false,
        promoCodeId: null,
        discountAmount: 0,
        error: 'Failed to validate code',
      })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleCheckout = async () => {
    setIsProcessing(true)

    try {
      const result = await onCheckout({
        eventId: event.id,
        eventTitle: event.title,
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        quantity,
        pricePerTicket: ticketType.price,
        userId,
        promoCodeId: promoValidation?.valid ? promoValidation.promoCodeId! : undefined,
        discountAmount: discount,
      })

      if (result.success && result.url) {
        // Redirect to Chapa Checkout
        window.location.href = result.url
      } else {
        alert(result.error || 'Failed to create checkout session')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('[CheckoutForm]:', error)
      alert('An error occurred')
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Order Summary */}
      <div className="md:col-span-2 space-y-6">
        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {event.image_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <div>
                    📅 {formatDate(event.start_time)} at {formatTime(event.start_time)}
                  </div>
                  <div>📍 {event.location}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{ticketType.name}</div>
                {ticketType.description && (
                  <div className="text-sm text-muted-foreground mt-1">{ticketType.description}</div>
                )}
                <div className="text-sm text-muted-foreground mt-2">Quantity: {quantity}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(ticketType.price)}</div>
                <div className="text-sm text-muted-foreground">per ticket</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promo Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promo Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase())
                  setPromoValidation(null)
                }}
                placeholder="Enter promo code"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                onClick={handleValidatePromo}
                disabled={!promoCode.trim() || isValidatingPromo || isProcessing}
              >
                {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>

            {promoValidation && (
              <div className="mt-3">
                {promoValidation.valid ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Promo code applied! {formatCurrency(promoValidation.discountAmount)} off</span>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 dark:text-red-400">{promoValidation.error}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {waitlistId && (
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-lg">
            <p className="text-sm">
              <strong>Waitlist Offer:</strong> You're purchasing from the waitlist. Complete your purchase within 24
              hours.
            </p>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({quantity} {quantity === 1 ? 'ticket' : 'tickets'})
                </span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button onClick={handleCheckout} disabled={isProcessing || total <= 0} className="w-full" size="lg">
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
              <p>Pay with Telebirr, bank transfer, or card</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
