import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { createCheckoutSessionAction } from './actions'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface EventRow {
  id: string
  title: string
  slug: string
  start_time: string | null
  start_at: string | null
  location: string | null
  venue_name: string | null
  image_url: string | null
  status: string
}

interface TicketTypeRow {
  id: string
  name: string
  description: string | null
  price: number
  capacity: number
  sold: number
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const ticketTypeId = sp.ticket_type as string
  const quantity = parseInt(sp.quantity as string) || 1
  const waitlistId = sp.waitlist as string | undefined

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/signin?redirect=/events/${slug}/checkout?ticket_type=${ticketTypeId}&quantity=${quantity}`)
  }

  // Get event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, start_time, start_at, location, venue_name, image_url, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .single<EventRow>()

  if (!event) {
    redirect('/events')
  }

  // Get ticket type
  const { data: ticketType } = await supabase
    .from('ticket_types')
    .select('id, name, description, price, capacity, sold')
    .eq('id', ticketTypeId)
    .eq('event_id', event.id)
    .single<TicketTypeRow>()

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
        event={{
          id: event.id,
          title: event.title,
          start_time: event.start_at ?? event.start_time ?? '',
          location: event.venue_name ?? event.location ?? '',
          image_url: event.image_url,
        }}
        ticketType={{
          id: ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          description: ticketType.description,
        }}
        quantity={quantity}
        userId={user.id}
        waitlistId={waitlistId}
        onCheckout={createCheckoutSessionAction}
      />
    </div>
  )
}
