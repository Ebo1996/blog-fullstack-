import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEventPromoCodes } from '@/services/promo-codes'
import { PromoCodesManager } from '@/components/organizer/promo-codes-manager'
import {
  createPromoCodeAction,
  updatePromoCodeAction,
  deletePromoCodeAction,
} from './actions'

export const metadata = {
  title: 'Promo Codes',
  description: 'Manage promotional discount codes',
}

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function PromoCodesPage({ params }: Props) {
  const { eventId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', eventId)
    .single<{ id: string; title: string; organizer_id: string }>()

  if (!event || event.organizer_id !== user.id) {
    redirect('/organizer/events')
  }

  const promoCodes = await getEventPromoCodes(eventId, user.id)

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Promo Codes</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      <PromoCodesManager
        eventId={eventId}
        promoCodes={promoCodes}
        onCreateCode={createPromoCodeAction}
        onUpdateCode={updatePromoCodeAction}
        onDeleteCode={deletePromoCodeAction}
      />
    </div>
  )
}
