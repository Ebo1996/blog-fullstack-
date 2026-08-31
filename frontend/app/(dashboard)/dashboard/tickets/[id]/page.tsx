'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Download, ArrowLeft, Send, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { ticketsApi } from '@/lib/api/tickets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { formatDateTime, formatDate, getTicketStatusBadge } from '@/lib/utils'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<any>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [transferOpen, setTransferOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    ticketsApi.get(id)
      .then((r) => setTicket(r.data))
      .catch(() => toast.error('Ticket not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleTransfer = async () => {
    if (!recipientEmail) return
    setTransferring(true)
    try {
      await ticketsApi.initiateTransfer(ticket._id, recipientEmail)
      toast.success('Transfer initiated! The recipient will receive a notification.')
      setTransferOpen(false)
      setRecipientEmail('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  const handleDownload = () => {
    // Convert the SVG QR code to a canvas and download as PNG
    const svg = document.querySelector('.digital-ticket svg') as SVGSVGElement | null
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 400; canvas.height = 500
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 400, 500)
      ctx.drawImage(img, 100, 40, 200, 200)
      ctx.fillStyle = '#111'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ticket.eventId?.title ?? 'Event', 200, 280)
      ctx.font = '13px sans-serif'
      ctx.fillStyle = '#555'
      ctx.fillText(ticket.ticketTypeName ?? '', 200, 305)
      ctx.fillText(ticket.ticketCode, 200, 328)
      const link = document.createElement('a')
      link.download = `ticket-${ticket.ticketCode}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
  }

  if (loading) {    return (
      <div className="page-content flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  if (!ticket) return <div className="page-content"><p>Ticket not found.</p></div>

  const badge = getTicketStatusBadge(ticket.status)
  const canTransfer = ticket.status === 'active' && !ticket.isTransferPending
  const event = ticket.eventId ?? {}

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">MY TICKETS / {(event.title ?? 'TICKET').toUpperCase()}</div>
          <h1>{event.title ?? 'Ticket'}</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        <Link href="/dashboard/tickets" className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to tickets
        </Link>

        {/* Digital ticket */}
        <div className="digital-ticket mb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className={`badge ${badge.cls} mb-3`}><span className="badge-dot" />{badge.label}</span>
              <h2>{event.title ?? 'Event'}</h2>
              <p style={{ color: '#6f6e65', fontSize: 12, margin: '4px 0' }}>
                {event.startAt ? formatDateTime(event.startAt) : '—'}
              </p>
              {event.venue && (
                <p style={{ color: '#6f6e65', fontSize: 12 }}>
                  {[event.venue.name, event.venue.address, event.venue.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="qr-box">
            <div className="qr-frame">
              <QRCodeSVG
                value={ticket.qrToken}
                size={155}
                bgColor="#ffffff"
                fgColor="#151512"
                level="H"
              />
            </div>
            <strong style={{ fontSize: 12, color: '#171713' }}>Scan at entry</strong>
            <span style={{ color: '#77766f', fontSize: 10 }}>Ticket ID: {ticket.ticketCode}</span>
          </div>

          {/* Ticket details */}
          <div className="digital-ticket-bottom">
            <div>
              <span>ATTENDEE</span>
              <strong>{ticket.ownerId?.name ?? 'You'}</strong>
            </div>
            <div>
              <span>TICKET TYPE</span>
              <strong>{ticket.ticketTypeName ?? ticket.ticketTypeId?.name ?? '—'}</strong>
            </div>
            <div>
              <span>TICKET #</span>
              <strong className="font-mono text-xs">{ticket.ticketCode}</strong>
            </div>
            {ticket.status === 'used' && ticket.checkedInAt && (
              <div>
                <span>CHECKED IN</span>
                <strong>{formatDateTime(ticket.checkedInAt)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download ticket
          </Button>
          {canTransfer && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <Send className="w-4 h-4" /> Transfer ticket
            </Button>
          )}
          {ticket.isTransferPending && (
            <Badge variant="warning">Transfer pending</Badge>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      <Modal isOpen={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer ticket">
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Enter the recipient's email address. They must have an Eventify account.
          </p>
          <Input
            label="Recipient email"
            type="email"
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} loading={transferring}>
              Send transfer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
