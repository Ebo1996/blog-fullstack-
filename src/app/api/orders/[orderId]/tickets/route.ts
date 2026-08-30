import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTicketsForOrder } from '@/services/payments'

interface Props {
  params: Promise<{ orderId: string }>
}

export async function GET(request: Request, { params }: Props) {
  const { orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await getTicketsForOrder(orderId, user.id)
  return NextResponse.json({ tickets })
}
