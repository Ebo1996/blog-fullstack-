'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, ArrowLeft, Check, X, Clock, AlertCircle,
  Calendar, MapPin, Ticket as TicketIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Alert } from '@/components/ui/alert'
import { formatDate, formatCurrency, formatRelative } from '@/lib/utils/format'
import type { TransferActionResult } from '@/app/dashboard/transfers/actions'

interface Transfer {
  id: string
  ticket_id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'
  created_at: string
  accepted_at: string | null
  expires_at: string
  ticket: {
    id: string
    ticket_code: string
    ticket_type: { name: string; price: number; currency: string }
    event: {
      id: string
      title: string
      slug: string
      start_at: string
      venue_name: string | null
      city: string | null
      image_url: string | null
    }
  }
  from_user?: { full_name: string | null; avatar_url: string | null }
  to_user?: { full_name: string | null; avatar_url: string | null }
}

interface TransfersClientProps {
  incomingTransfers: Transfer[]
  outgoingTransfers: Transfer[]
  acceptAction: (id: string) => Promise<TransferActionResult>
  rejectAction: (id: string) => Promise<TransferActionResult>
  cancelAction: (id: string) => Promise<TransferActionResult>
}

type Tab = 'incoming' | 'outgoing'

export function TransfersClient({
  incomingTransfers,
  outgoingTransfers,
  acceptAction,
  rejectAction,
  cancelAction,
}: TransfersClientProps) {
  const [tab, setTab] = useState<Tab>('incoming')

  const pendingIncoming = incomingTransfers.filter((t) => t.status === 'pending')
  const pendingOutgoing = outgoingTransfers.filter((t) => t.status === 'pending')

  const currentTransfers = tab === 'incoming' ? incomingTransfers : outgoingTransfers

  return (
    <div>
      {/* Tabs */}
      <div className="tabs" role="tablist" style={{ marginBottom: 24 }}>
        <button
          role="tab"
          aria-selected={tab === 'incoming'}
          className={`tab-item${tab === 'incoming' ? ' active' : ''}`}
          onClick={() => setTab('incoming')}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Incoming
          {pendingIncoming.length > 0 && (
            <span className="tab-count" style={{ background: 'var(--primary)' }}>
              {pendingIncoming.length}
            </span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'outgoing'}
          className={`tab-item${tab === 'outgoing' ? ' active' : ''}`}
          onClick={() => setTab('outgoing')}
        >
          <ArrowRight size={14} aria-hidden="true" />
          Outgoing
          {pendingOutgoing.length > 0 && (
            <span className="tab-count" style={{ background: 'var(--muted)' }}>
              {pendingOutgoing.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {currentTransfers.length === 0 ? (
        <EmptyState
          icon={tab === 'incoming' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
          title={tab === 'incoming' ? 'No incoming transfers' : 'No outgoing transfers'}
          description={
            tab === 'incoming'
              ? 'When someone transfers a ticket to you, it will appear here.'
              : 'Tickets you transfer to others will appear here.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {currentTransfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              direction={tab}
              acceptAction={acceptAction}
              rejectAction={rejectAction}
              cancelAction={cancelAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual transfer card ─────────────────────────────────────────────────

function TransferCard({
  transfer,
  direction,
  acceptAction,
  rejectAction,
  cancelAction,
}: {
  transfer: Transfer
  direction: Tab
  acceptAction: (id: string) => Promise<TransferActionResult>
  rejectAction: (id: string) => Promise<TransferActionResult>
  cancelAction: (id: string) => Promise<TransferActionResult>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState(transfer.status)

  const isPending = localStatus === 'pending'
  const isExpired = new Date(transfer.expires_at) < new Date()
  const event = transfer.ticket.event

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const res = await acceptAction(transfer.id)
      if (res.error) { setError(res.error); return }
      setLocalStatus('accepted')
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const res = await rejectAction(transfer.id)
      if (res.error) { setError(res.error); return }
      setLocalStatus('rejected')
    })
  }

  function handleCancel() {
    setError(null)
    startTransition(async () => {
      const res = await cancelAction(transfer.id)
      if (res.error) { setError(res.error); return }
      setLocalStatus('cancelled')
    })
  }

  const statusBadge = {
    pending:   <Badge variant="warning">Pending</Badge>,
    accepted:  <Badge variant="success">Accepted</Badge>,
    rejected:  <Badge variant="neutral">Rejected</Badge>,
    cancelled: <Badge variant="neutral">Cancelled</Badge>,
    expired:   <Badge variant="error">Expired</Badge>,
  }[localStatus]

  const otherUser = direction === 'incoming' ? transfer.from_user : transfer.to_user

  return (
    <div
      className="panel"
      style={{
        padding: 0,
        overflow: 'hidden',
        opacity: localStatus === 'pending' ? 1 : 0.7,
        transition: 'opacity var(--transition-base)',
      }}
    >
      <div style={{ display: 'flex', gap: 16, padding: 20 }}>
        {/* Event image */}
        <Link
          href={`/events/${event.slug}`}
          style={{ flexShrink: 0, position: 'relative', width: 140, height: 105, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
        >
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--muted)', display: 'grid', placeItems: 'center' }}>
              <TicketIcon size={24} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
            </div>
          )}
        </Link>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <div>
              <Link
                href={`/events/${event.slug}`}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', textDecoration: 'none', color: 'var(--foreground)' }}
              >
                {event.title}
              </Link>
            </div>
            {statusBadge}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-foreground)' }}>
              <Calendar size={13} aria-hidden="true" />
              {formatDate(event.start_at, 'EEE, MMM d, yyyy · h:mm a')}
            </div>
            {event.venue_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-foreground)' }}>
                <MapPin size={13} aria-hidden="true" />
                {event.venue_name}
                {event.city && ` · ${event.city}`}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-foreground)' }}>
              <TicketIcon size={13} aria-hidden="true" />
              {transfer.ticket.ticket_type.name} · {formatCurrency(transfer.ticket.ticket_type.price, transfer.ticket.ticket_type.currency)}
            </div>
          </div>

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: error ? 8 : 0 }}>
            <Avatar
              src={otherUser?.avatar_url}
              name={otherUser?.full_name}
              size="sm"
            />
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              {direction === 'incoming' ? 'From' : 'To'}{' '}
              <strong style={{ color: 'var(--foreground)' }}>
                {otherUser?.full_name ?? 'User'}
              </strong>
              {' · '}
              {formatRelative(transfer.created_at)}
            </span>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="error" style={{ marginTop: 8 }}>
              <AlertCircle size={13} aria-hidden="true" />
              {error}
            </Alert>
          )}

          {/* Expiry warning */}
          {isPending && !isExpired && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>
              <Clock size={11} aria-hidden="true" />
              Expires {formatRelative(transfer.expires_at)}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && !isExpired && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '14px 20px',
            background: 'var(--muted)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          {direction === 'incoming' ? (
            <>
              <button
                onClick={handleReject}
                disabled={pending}
                className="button button-muted"
                style={{ gap: 6 }}
              >
                <X size={14} aria-hidden="true" />
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={pending}
                className="button button-primary"
                style={{ gap: 6 }}
              >
                <Check size={14} aria-hidden="true" />
                {pending ? 'Accepting…' : 'Accept'}
              </button>
            </>
          ) : (
            <button
              onClick={handleCancel}
              disabled={pending}
              className="button button-muted"
              style={{ gap: 6 }}
            >
              <X size={14} aria-hidden="true" />
              {pending ? 'Cancelling…' : 'Cancel Transfer'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
