'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Users,
  X,
} from 'lucide-react'
import { EventArt } from './event-art'
import { TransferStatusBadge } from '@/components/ui/badge'
import { formatDate, formatRelative } from '@/lib/utils/format'
import type { TransferWithDetails } from '@/types'

interface TransfersClientProps {
  incoming: TransferWithDetails[]
  outgoing: TransferWithDetails[]
  currentUserId: string
  acceptAction: (id: string) => Promise<{ error?: string }>
  rejectAction:  (id: string) => Promise<{ error?: string }>
  cancelAction:  (id: string) => Promise<{ error?: string }>
}

export function TransfersClient({
  incoming,
  outgoing,
  acceptAction,
  rejectAction,
  cancelAction,
}: TransfersClientProps) {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming')

  const incomingPending = incoming.filter((t) => t.status === 'pending').length

  return (
    <>
      {/* ── Tab bar — matches prototype .tabs pattern ──────────── */}
      <div className="tabs" role="tablist" aria-label="Transfer tabs">
        <button
          role="tab"
          id="tab-incoming"
          aria-controls="tabpanel-incoming"
          aria-selected={tab === 'incoming'}
          className={`tab-item${tab === 'incoming' ? ' active' : ''}`}
          onClick={() => setTab('incoming')}
        >
          Incoming
          {incomingPending > 0 && (
            <span
              className="nav-count"
              style={{ marginLeft: 6 }}
              aria-label={`${incomingPending} pending`}
            >
              {incomingPending}
            </span>
          )}
        </button>
        <button
          role="tab"
          id="tab-outgoing"
          aria-controls="tabpanel-outgoing"
          aria-selected={tab === 'outgoing'}
          className={`tab-item${tab === 'outgoing' ? ' active' : ''}`}
          onClick={() => setTab('outgoing')}
        >
          Outgoing
        </button>
      </div>

      {/* ── Incoming panel ─────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="tabpanel-incoming"
        aria-labelledby="tab-incoming"
        hidden={tab !== 'incoming'}
      >
        {incoming.length === 0 ? (
          <EmptyTransfers
            icon={<ArrowDownLeft size={24} />}
            title="No incoming transfers"
            description="When someone sends you a ticket, it will appear here."
          />
        ) : (
          <div className="panel list-panel" style={{ marginTop: 0 }}>
            {incoming.map((t) => (
              <IncomingRow
                key={t.id}
                transfer={t}
                acceptAction={acceptAction}
                rejectAction={rejectAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Outgoing panel ─────────────────────────────────────── */}
      <div
        role="tabpanel"
        id="tabpanel-outgoing"
        aria-labelledby="tab-outgoing"
        hidden={tab !== 'outgoing'}
      >
        {outgoing.length === 0 ? (
          <EmptyTransfers
            icon={<ArrowUpRight size={24} />}
            title="No outgoing transfers"
            description="Tickets you transfer to others will appear here."
          />
        ) : (
          <div className="panel list-panel" style={{ marginTop: 0 }}>
            {outgoing.map((t) => (
              <OutgoingRow
                key={t.id}
                transfer={t}
                cancelAction={cancelAction}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Incoming row ─────────────────────────────────────────────────────────────

function IncomingRow({
  transfer,
  acceptAction,
  rejectAction,
}: {
  transfer: TransferWithDetails
  acceptAction: (id: string) => Promise<{ error?: string }>
  rejectAction:  (id: string) => Promise<{ error?: string }>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null)

  const event = transfer.ticket.event
  const isPending = transfer.status === 'pending'
  const isExpired = transfer.status === 'expired' || new Date(transfer.expires_at) < new Date()

  function act(fn: (id: string) => Promise<{ error?: string }>, result: 'accepted' | 'rejected') {
    setError(null)
    startTransition(async () => {
      const res = await fn(transfer.id)
      if (res.error) {
        setError(res.error)
      } else {
        setDone(result)
      }
    })
  }

  return (
    <div
      className="order-row"
      style={{ alignItems: 'flex-start', paddingTop: 18, paddingBottom: 18 }}
    >
      {/* Direction icon */}
      <div className="order-icon" aria-hidden="true">
        {done === 'accepted' ? <Check size={15} /> :
         done === 'rejected' ? <X size={15} /> :
         isExpired ? <Clock size={15} /> :
         <ArrowDownLeft size={15} />}
      </div>

      {/* Event art */}
      {event && (
        <EventArt title={event.title} id={transfer.ticket_id} small />
      )}

      {/* Info */}
      <div className="event-copy" style={{ flex: 1, minWidth: 0 }}>
        <strong>{event?.title ?? 'Event ticket'}</strong>
        <span>
          From{' '}
          <strong style={{ color: 'var(--foreground)' }}>
            {transfer.from_user.full_name ?? 'Someone'}
          </strong>
        </span>
        {event?.start_at && (
          <span style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays size={10} aria-hidden="true" />
            {formatDate(event.start_at, 'MMM d, yyyy')}
          </span>
        )}
        <span style={{ marginTop: 2, color: 'var(--muted-foreground)', fontSize: 10 }}>
          {formatRelative(transfer.created_at)}
        </span>
        {isExpired && !done && (
          <span style={{ color: 'var(--warning)', fontSize: 10, fontWeight: 700, marginTop: 2 }}>
            Expired
          </span>
        )}
        {error && (
          <span style={{ color: 'var(--error)', fontSize: 11, marginTop: 4 }}>{error}</span>
        )}
      </div>

      {/* Status / actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        {done ? (
          <TransferStatusBadge status={done} />
        ) : isPending && !isExpired ? (
          <>
            <span style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 700 }}>
              Expires {formatRelative(transfer.expires_at)}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="button button-primary button-sm"
                style={{ fontSize: 11, gap: 6 }}
                onClick={() => act(acceptAction, 'accepted')}
                disabled={pending}
                aria-busy={pending}
              >
                <Check size={12} aria-hidden="true" />
                Accept
              </button>
              <button
                className="button button-sm"
                style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 0, fontSize: 11, gap: 6 }}
                onClick={() => act(rejectAction, 'rejected')}
                disabled={pending}
                aria-busy={pending}
              >
                <X size={12} aria-hidden="true" />
                Decline
              </button>
            </div>
          </>
        ) : (
          <TransferStatusBadge status={transfer.status} />
        )}
      </div>
    </div>
  )
}

// ─── Outgoing row ─────────────────────────────────────────────────────────────

function OutgoingRow({
  transfer,
  cancelAction,
}: {
  transfer: TransferWithDetails
  cancelAction: (id: string) => Promise<{ error?: string }>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  const event = transfer.ticket.event
  const canCancel = (transfer.status === 'pending') && !cancelled

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const res = await cancelAction(transfer.id)
      if (res.error) {
        setError(res.error)
      } else {
        setCancelled(true)
      }
    })
  }

  return (
    <div
      className="order-row"
      style={{ alignItems: 'flex-start', paddingTop: 18, paddingBottom: 18 }}
    >
      {/* Direction icon */}
      <div className="order-icon" aria-hidden="true">
        {cancelled ? <X size={15} /> : <ArrowUpRight size={15} />}
      </div>

      {/* Event art */}
      {event && (
        <EventArt title={event.title} id={transfer.ticket_id} small />
      )}

      {/* Info */}
      <div className="event-copy" style={{ flex: 1, minWidth: 0 }}>
        <strong>{event?.title ?? 'Event ticket'}</strong>
        <span>
          To{' '}
          <strong style={{ color: 'var(--foreground)' }}>
            {transfer.to_user.full_name ?? 'Recipient'}
          </strong>
        </span>
        {event?.start_at && (
          <span style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays size={10} aria-hidden="true" />
            {formatDate(event.start_at, 'MMM d, yyyy')}
          </span>
        )}
        <span style={{ marginTop: 2, color: 'var(--muted-foreground)', fontSize: 10 }}>
          {formatRelative(transfer.created_at)}
        </span>
        {error && (
          <span style={{ color: 'var(--error)', fontSize: 11, marginTop: 4 }}>{error}</span>
        )}
      </div>

      {/* Status / actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <TransferStatusBadge status={cancelled ? 'cancelled' : transfer.status} />

        {canCancel && (
          <button
            className="button button-sm"
            style={{ background: 'var(--muted)', color: 'var(--foreground)', border: 0, fontSize: 11 }}
            onClick={handleCancel}
            disabled={pending}
            aria-busy={pending}
            aria-label={`Cancel transfer for ${event?.title ?? 'ticket'}`}
          >
            <Users size={11} style={{ marginRight: 4 }} aria-hidden="true" />
            {pending ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyTransfers({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="panel" style={{ marginTop: 0 }}>
      <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <Link href="/dashboard/tickets" className="button button-outline" style={{ marginTop: 4 }}>
          View my tickets
        </Link>
      </div>
    </div>
  )
}
