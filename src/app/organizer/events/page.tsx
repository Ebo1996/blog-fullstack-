import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CalendarDays, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { EventStatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { EventArt } from '@/components/attendee/event-art'
import { getOrganizerEvents } from '@/services/organizer'
import { formatDate, formatNumber } from '@/lib/utils/format'
import type { Profile, EventStatus } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Events' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_TABS: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft',     value: 'draft' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default async function OrganizerEventsPage({ searchParams }: Props) {
  const sp = await searchParams
  const statusParam = (Array.isArray(sp['status']) ? sp['status'][0] : sp['status']) ?? 'all'
  const page = Math.max(1, parseInt((Array.isArray(sp['page']) ? sp['page'][0] : sp['page']) ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const result = await getOrganizerEvents(
    user.id,
    page,
    statusParam !== 'all' ? (statusParam as EventStatus) : undefined,
  )

  return (
    <>
      <OrganizerHeader title="Events" eyebrow="YOUR EVENTS" profile={profile} showNewEvent />

      <main className="content">
        <div className="page-intro">
          <p>Manage your events, tickets, and attendees.</p>
          <Link href="/organizer/events/new" className="button button-primary" style={{ gap: 6 }}>
            <Plus size={14} aria-hidden="true" /> New event
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="tabs" role="tablist" aria-label="Filter events by status">
          {STATUS_TABS.map((tab) => (
            <a
              key={tab.value}
              href={`/organizer/events?status=${tab.value}`}
              role="tab"
              aria-selected={statusParam === tab.value}
              className={`tab-item${statusParam === tab.value ? ' active' : ''}`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {result.data.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title={statusParam === 'all' ? 'No events yet' : `No ${statusParam} events`}
            description={
              statusParam === 'all'
                ? 'Create your first event and start selling tickets in minutes.'
                : `You have no ${statusParam} events.`
            }
            action={{ label: 'Create event', href: '/organizer/events/new' }}
          />
        ) : (
          <>
            <div className="data-table-wrapper" style={{ marginTop: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Tickets sold</th>
                    <th>Revenue</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((event) => {
                    const sold = event.ticket_types?.reduce((s, t) => s + t.sold_quantity, 0) ?? 0
                    const rev  = event.ticket_types?.reduce((s, t) => s + t.price * t.sold_quantity, 0) ?? 0
                    return (
                      <tr key={event.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <EventArt title={event.title} id={event.id} small />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{event.title}</p>
                              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                                {event.city ?? 'TBD'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                          {formatDate(event.start_at, 'MMM d, yyyy')}
                        </td>
                        <td><EventStatusBadge status={event.status} /></td>
                        <td style={{ fontSize: 13 }}>{formatNumber(sold)}</td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>
                          {rev > 0
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rev / 100)
                            : '—'}
                        </td>
                        <td>
                          <Link
                            href={`/organizer/events/${event.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}
                          >
                            Manage <ChevronRight size={13} aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/organizer/events?status=${statusParam}&page=${p}`}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    style={{
                      display: 'grid', placeItems: 'center',
                      width: 34, height: 34, borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: p === page ? 'var(--organizer-accent)' : 'var(--border)',
                      background: p === page ? 'var(--organizer-accent)' : 'transparent',
                      color: p === page ? '#fff' : 'var(--foreground)',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    {p}
                  </a>
                ))}
              </nav>
            )}
          </>
        )}
      </main>
    </>
  )
}
