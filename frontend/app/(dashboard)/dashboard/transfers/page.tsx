'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ArrowLeft, Users, Check, X as XIcon } from 'lucide-react'
import { ticketsApi } from '@/lib/api/tickets'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { formatDate, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

export default function TransfersPage() {
  const { user } = useAuth()
  const [sent, setSent] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sent' | 'pending'>('pending')

  const load = async () => {
    setLoading(true)
    try {
      const [sentRes, pendingRes] = await Promise.all([
        ticketsApi.myTransfers(),
        ticketsApi.pendingTransfers(),
      ])
      setSent(sentRes.data?.transfers ?? sentRes.data ?? [])
      setPending(pendingRes.data?.transfers ?? pendingRes.data ?? [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAccept = async (id: string) => {
    try {
      await ticketsApi.acceptTransfer(id)
      toast.success('Transfer accepted! Ticket is now yours.')
      load()
    } catch (err: any) { toast.error(err?.message ?? 'Failed to accept') }
  }

  const handleReject = async (id: string) => {
    try {
      await ticketsApi.rejectTransfer(id)
      toast.success('Transfer declined.')
      load()
    } catch (err: any) { toast.error(err?.message ?? 'Failed to reject') }
  }

  const handleCancel = async (id: string) => {
    try {
      await ticketsApi.cancelTransfer(id)
      toast.success('Transfer cancelled.')
      load()
    } catch (err: any) { toast.error(err?.message ?? 'Failed to cancel') }
  }

  const statusBadge = (status: string) => {
    if (status === 'pending') return <Badge variant="warning" dot>Pending</Badge>
    if (status === 'accepted') return <Badge variant="success" dot>Accepted</Badge>
    if (status === 'rejected') return <Badge variant="danger" dot>Rejected</Badge>
    return <Badge variant="neutral">{status}</Badge>
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">TICKET SHARING</div>
          <h1>Transfers</h1>
        </div>
      </header>

      <div className="page-content">
        <p className="text-xs text-[var(--muted-foreground)] mb-6">Share tickets with friends, without the group-chat chaos.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'sent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`}
            >
              {t === 'pending' ? 'Incoming' : 'Sent'}
              {t === 'pending' && pending.length > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-[var(--primary-foreground)] text-[var(--primary)] text-[9px] font-bold grid place-items-center">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="panel space-y-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'pending' && (
              pending.length === 0 ? (
                <EmptyState icon={ArrowLeft} title="No incoming transfers" description="Tickets sent to you will appear here for you to accept." />
              ) : (
                <div className="panel">
                  {pending.map((t, i) => (
                    <div key={t._id} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <ArrowLeft className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{t.ticketId?.eventId?.title ?? 'Ticket'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">From {t.senderId?.name ?? 'Unknown'} · {timeAgo(t.createdAt)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleAccept(t._id)} className="btn btn-primary btn-sm gap-1.5">
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button onClick={() => handleReject(t._id)} className="btn btn-outline btn-sm gap-1.5">
                          <XIcon className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'sent' && (
              sent.length === 0 ? (
                <EmptyState icon={ArrowRight} title="No transfers sent" description="Tickets you transfer to others will appear here." />
              ) : (
                <div className="panel">
                  {sent.map((t, i) => (
                    <div key={t._id} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{t.ticketId?.eventId?.title ?? 'Ticket'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          To {t.recipientEmail} · {timeAgo(t.createdAt)}
                        </p>
                      </div>
                      {statusBadge(t.status)}
                      {t.status === 'pending' && (
                        <button onClick={() => handleCancel(t._id)} className="btn btn-outline btn-sm">
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </>
  )
}
