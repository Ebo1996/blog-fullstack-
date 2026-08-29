import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { OrdersClient } from '@/components/admin/orders-client'
import { getAdminOrders } from '@/services/admin'
import type { Profile, OrderStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Admin — Orders' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp     = await searchParams
  const status = (Array.isArray(sp['status']) ? sp['status'][0] : sp['status']) as OrderStatus | undefined
  const page   = Math.max(1, parseInt((Array.isArray(sp['page']) ? sp['page'][0] : sp['page']) ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: orders, count, totalPages } = await getAdminOrders('', status, page)

  return (
    <>
      <AdminHeader title="Orders" eyebrow="PLATFORM ORDERS" profile={profile} />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>{count} order{count !== 1 ? 's' : ''} on the platform.</p>
        </div>

        <OrdersClient
          orders={orders}
          totalPages={totalPages}
          currentPage={page}
          currentStatus={status}
        />
      </main>
    </>
  )
}
