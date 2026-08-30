import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ orderId: string }>
}

// Lightweight polling endpoint used by the success page.
// Returns only order status — no sensitive payment data.
export async function GET(request: Request, { params }: Props) {
  const { orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)   // RLS + explicit user check
    .single<{ id: string; status: string }>()

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ status: data.status })
}
