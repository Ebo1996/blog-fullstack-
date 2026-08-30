import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Clock, QrCode, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EmptyState } from '@/components/ui/empty-state'
import { getOrganizerEventById, getCheckInSummary } from '@/services/organizer'
import { formatDate } from '@/lib/utils/format'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Check-ins' }

interface Props { params: Promise<{ eventId: string }> }

export default async function CheckInsPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const [event, summary] = await Promise.all([
    getOrganizerEventById(eventId, user.id),
    getCheckInSummary(eventId, user.id),
  ])
  if (!event) notFound()

  const ratePct = summary.rate

  return (
    <>
      <OrganizerHeader title="Check-ins" eyebrow="CHECK-IN PROGRESS" profile={profile} />

      <main className="content">

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <p className="stat-label">Total tickets</p>
            <p className="stat-value">{summary.total}</p>
          </div>
          <div className="stat-card" style={{ borderColor: 'rgba(200,231,107,0.25)' }}>
            <p className="stat-label">Checked in</p>
            <p className="stat-value" style={{ color: 'var(--success)' }}>{summary.checkedIn}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Remaining</p>
            <p className="stat-value">{summary.remaining}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Check-in rate</p>
            <p className="stat-value">{ratePct}%</p>
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────── */}
        {summary.total > 0 && (
          <div
            style={{ marginBottom: 28 }}
            role="progressbar"
            aria-label={`${ratePct}% checked in`}
            aria-valuenow={ratePct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6 }}>
              <span>{summary.checkedIn} checked in</span>
              <span>{summary.remaining} remaining</span>
            </div>
            <div style={{ height: 8, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(ratePct, 100)}%`,
                  background: ratePct >= 80 ? 'var(--success)' : 'var(--organizer-accent)',
                  borderRadius: 99,
                  transition: 'width var(--transition-slow)',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Scanner CTA ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, padding: '18px 22px', marginBottom: 28,
            background: 'var(--organizer-accent-bg)',
            border: '1px solid rgba(124,106,245,0.25)',
            borderRadius: 'var(--radius-lg)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                display: 'grid', placeItems: 'center',
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: 'var(--organizer-accent)', color: '#fff',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <QrCode size={22} />
            </span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>Ready to scan</p>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
                Open the scanner to check in attendees by QR code.
              </p>
            </div>
          </div>
          <Link
            href={`/organizer/events/${eventId}/scanner`}
            className="button button-primary"
            style={{ gap: 7 }}
          >
            <QrCode size={15} aria-hidden="true" />
            Open scanner
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* ── Recent check-ins ─────────────────────────────────────── */}
        <div className="section-heading" style={{ marginTop: 0 }}>
          <div>
            <div className="eyebrow">RECENT</div>
            <h2>Latest check-ins</h2>
          </div>
        </div>

        {summary.recent.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={22} />}
            title="No check-ins yet"
            description="Check-ins will appear here in real time as attendees scan their tickets."
            action={{ label: 'Open scanner', href: `/organizer/events/${eventId}/scanner` }}
          />
        ) : (
          <div className="panel list-panel" style={{ marginTop: 16 }}>
            {summary.recent.map((ci) => (
              <div key={ci.id} className="order-row" style={{ paddingTop: 14, paddingBottom: 14 }}>
                <div
                  className="order-icon"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                  aria-hidden="true"
                >
                  <CheckCircle size={15} />
                </div>
                <div className="event-copy" style={{ flex: 1, minWidth: 0 }}>
                  <strong>{ci.attendee_name ?? 'Attendee'}</strong>
                  <span>
                    {ci.ticket_type_name} ·{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      {ci.ticket_code}
                    </span>
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted-foreground)', justifyContent: 'flex-end' }}>
                    <Clock size={11} aria-hidden="true" />
                    {formatDate(ci.checked_in_at, 'h:mm a')}
                  </span>
                  {ci.checked_in_by_name && (
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                      by {ci.checked_in_by_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
