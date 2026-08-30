import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowUpRight, CalendarDays, MapPin, Users,
  Ticket, QrCode, BarChart2, Edit, Eye,
  ChevronRight, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EventStatusBadge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { EventStatusActions } from '@/components/organizer/event-status-actions'
import { getOrganizerEventById } from '@/services/organizer'
import { formatDate, formatDateRange, formatCurrency, formatNumber } from '@/lib/utils/format'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

interface Props { params: Promise<{ eventId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const event = await getOrganizerEventById(eventId, user.id)
  return { title: event?.title ?? 'Event' }
}

const NAV_CARDS = [
  { segment: 'tickets',    label: 'Ticket types', icon: Ticket,    desc: 'Manage pricing & inventory' },
  { segment: 'orders',     label: 'Orders',       icon: ChevronRight, desc: 'View all transactions' },
  { segment: 'attendees',  label: 'Attendees',    icon: Users,     desc: 'Guest list & check-in status' },
  { segment: 'check-ins',  label: 'Check-ins',    icon: QrCode,    desc: 'Live check-in progress' },
  { segment: 'scanner',    label: 'Scanner',      icon: QrCode,    desc: 'Scan QR codes at the door' },
  { segment: 'analytics',  label: 'Analytics',    icon: BarChart2, desc: 'Sales & revenue charts' },
]

export default async function EventHubPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const event = await getOrganizerEventById(eventId, user.id)
  if (!event) notFound()

  const ticketTypes  = event.ticket_types ?? []
  const totalSold    = ticketTypes.reduce((s, t) => s + t.sold_quantity, 0)
  const totalRevenue = ticketTypes.reduce((s, t) => s + t.price * t.sold_quantity, 0)
  const capacity     = event.capacity
  const soldPct      = capacity ? Math.round((totalSold / capacity) * 100) : null

  const isPast       = new Date(event.end_at) < new Date()
  const isPublished  = event.status === 'published'
  const isDraft      = event.status === 'draft'

  return (
    <>
      <OrganizerHeader
        title={event.title}
        eyebrow="EVENT MANAGEMENT"
        profile={profile}
        actions={
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-outline button-sm"
            style={{ gap: 6, fontSize: 11 }}
          >
            <Eye size={12} aria-hidden="true" />
            Public page
          </Link>
        }
      />

      <main className="content">

        {/* ── Event hero ─────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--organizer-accent-bg)',
            border: '1px solid rgba(124,106,245,0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            marginBottom: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <EventStatusBadge status={event.status} />
              {event.category && (
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                  {event.category.name}
                </span>
              )}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px',
              }}
            >
              {event.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CalendarDays size={13} aria-hidden="true" style={{ color: 'var(--organizer-accent)' }} />
                {formatDateRange(event.start_at, event.end_at)}
              </span>
              {(event.venue_name || event.city) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} aria-hidden="true" style={{ color: 'var(--organizer-accent)' }} />
                  {[event.venue_name, event.city].filter(Boolean).join(', ')}
                </span>
              )}
              {capacity && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} aria-hidden="true" />
                  {formatNumber(capacity)} capacity
                </span>
              )}
            </div>
          </div>

          {/* Status actions + edit */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <Link
              href={`/organizer/events/${eventId}/edit`}
              className="button button-outline button-sm"
              style={{ gap: 6, fontSize: 12 }}
            >
              <Edit size={13} aria-hidden="true" />
              Edit
            </Link>
            <EventStatusActions
              eventId={eventId}
              currentStatus={event.status}
              isDraft={isDraft}
              isPublished={isPublished}
              isPast={isPast}
            />
          </div>
        </div>

        {/* ── Draft warning ──────────────────────────────────── */}
        {isDraft && (
          <div className="alert alert-warning" style={{ marginBottom: 24 }}>
            <AlertCircle size={14} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 13 }}>
              This event is a <strong>draft</strong> and not visible to the public.
              {ticketTypes.length === 0
                ? ' Add at least one ticket type before publishing.'
                : ' You can publish it when you\'re ready.'}
            </p>
          </div>
        )}

        {/* ── Stats ──────────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard
            label="Tickets sold"
            value={formatNumber(totalSold)}
            icon={<Ticket size={16} />}
            delta={soldPct !== null ? `${soldPct}% capacity` : undefined}
            deltaDirection={soldPct !== null && soldPct >= 80 ? 'up' : 'neutral'}
          />
          <StatCard
            label="Revenue"
            value={totalRevenue > 0 ? formatCurrency(totalRevenue) : '—'}
            icon={<BarChart2 size={16} />}
          />
          <StatCard
            label="Ticket types"
            value={ticketTypes.length}
            icon={<Ticket size={16} />}
          />
          <StatCard
            label="Capacity"
            value={capacity ? formatNumber(capacity) : 'Unlimited'}
            icon={<Users size={16} />}
          />
        </div>

        {/* ── Nav cards ──────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {NAV_CARDS.map((card) => {
            const Icon = card.icon
            const href = `/organizer/events/${eventId}/${card.segment}`
            return (
              <Link
                key={card.segment}
                href={href}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 12,
                  padding: '18px 20px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                }}
                className="hover-tile"
              >
                <span
                  style={{
                    display: 'grid', placeItems: 'center',
                    width: 36, height: 36, borderRadius: 9,
                    background: 'var(--organizer-accent-bg)',
                    color: 'var(--organizer-accent)',
                  }}
                  aria-hidden="true"
                >
                  <Icon size={17} />
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px' }}>
                    {card.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                    {card.desc}
                  </p>
                </div>
                <ArrowUpRight
                  size={14}
                  style={{ color: 'var(--muted-foreground)', marginTop: 'auto', alignSelf: 'flex-end' }}
                  aria-hidden="true"
                />
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
