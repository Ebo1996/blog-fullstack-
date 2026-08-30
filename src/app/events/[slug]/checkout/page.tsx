import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { createCheckoutSessionAction } from './actions'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const ticketTypeId = sp.ticket_type as string
  const quantity = parseInt(sp.quantity as string) || 1
  const waitlistId = sp.waitlist as string | undefined

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/signin?redirect=/events/${slug}/checkout?ticket_type=${ticketTypeId}&quantity=${quantity}`)
  }

  // Get event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) {
    redirect('/events')
  }

  // Get ticket type
  const { data: ticketType } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('id', ticketTypeId)
    .eq('event_id', event.id)
    .single()

  if (!ticketType) {
    redirect(`/events/${slug}`)
  }

  // Check availability
  const available = ticketType.capacity - ticketType.sold
  if (available < quantity) {
    redirect(`/events/${slug}?error=sold_out`)
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <CheckoutForm
        event={event}
        ticketType={ticketType}
        quantity={quantity}
        userId={user.id}
        waitlistId={waitlistId}
        onCheckout={createCheckoutSessionAction}
      />
    </div>
  )
}
