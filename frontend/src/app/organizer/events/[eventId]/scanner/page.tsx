import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { QRScanner } from '@/components/organizer/qr-scanner'
import { getOrganizerEventById, getCheckInSummary } from '@/services/organizer'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'QR Scanner' }

interface Props { params: Promise<{ eventId: string }> }

export default async function ScannerPage({ params }: Props) {
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

  const isPast = new Date(event.end_at) < new Date()

  return (
    <>
      <OrganizerHeader
        title="QR Scanner"
        eyebrow={event.title.toUpperCase()}
        profile={profile}
      />

      <main className="content" style={{ maxWidth: 560 }}>
        {/* Back link */}
        <Link
          href={`/organizer/events/${eventId}/check-ins`}
          className="back-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 20 }}
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to check-ins
        </Link>

        {/* Past event warning */}
        {isPast && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            <AlertCircle size={14} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 13 }}>
              This event has ended. You can still scan tickets for audit purposes.
            </p>
          </div>
        )}

        {/* Live stats */}
        <div className="chart-grid-3col">
          {[
            { label: 'Checked in',  value: summary.checkedIn, color: 'var(--success)' },
            { label: 'Remaining',   value: summary.remaining, color: 'var(--foreground)' },
            { label: 'Rate',        value: `${summary.rate}%`, color: 'var(--organizer-accent)' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, margin: '0 0 2px', color: s.color }}>
                {s.value}
              </p>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', margin: 0, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Scanner */}
        <QRScanner eventId={eventId} />

        {/* Instructions */}
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--muted)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--foreground)', display: 'block', marginBottom: 4 }}>How to use</strong>
          Point the camera at the attendee&apos;s QR code. The scanner validates the ticket
          against this event automatically — no tapping required.
          Each ticket can only be scanned once.
        </div>
      </main>
    </>
  )
}
