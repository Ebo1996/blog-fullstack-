import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getPublishedEvents, getEventCities } from '@/services/events'
import { getAllCategories } from '@/services/categories'
import { EventCard } from '@/components/public/event-card'
import { EventsFilters, EventsSearchBar } from '@/components/public/events-filters'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton'
import { CalendarDays } from 'lucide-react'
import type { EventFilters } from '@/types'

export const metadata: Metadata = {
  title: 'Discover Events',
  description: 'Browse conferences, concerts, workshops, meetups, festivals and more.',
}

// Force dynamic rendering to ensure cookies() is called in request context
export const dynamic = 'force-dynamic'

interface EventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getString(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams

  const filters: EventFilters = {
    search:   getString(params['search']),
    category: getString(params['category']),
    city:     getString(params['city']),
    dateFrom: getString(params['dateFrom']),
    dateTo:   getString(params['dateTo']),
    sort:     (getString(params['sort']) || 'date_asc') as EventFilters['sort'],
  }
  const page = Math.max(1, parseInt(getString(params['page']) || '1', 10))

  const [result, categories, cities] = await Promise.all([
    getPublishedEvents(filters, page),
    getAllCategories(),
    getEventCities(),
  ])

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>DISCOVER</p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, letterSpacing: '-0.02em', margin: 0,
          }}
        >
          {filters.search
            ? `Results for "${filters.search}"`
            : filters.category
              ? `${categories.find((c) => c.slug === filters.category)?.name ?? 'Category'} events`
              : 'All events'}
        </h1>
        {result.count > 0 && (
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginTop: 8 }}>
            {result.count} event{result.count !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 28 }}>
        <Suspense>
          <EventsSearchBar />
        </Suspense>
      </div>

      {/* Active filters shown on mobile as chips */}
      {(filters.category || filters.city) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {filters.category && (
            <a href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(215,243,106,0.08)', border: '1px solid rgba(215,243,106,0.2)', borderRadius: 99, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
              {categories.find(c => c.slug === filters.category)?.name} ×
            </a>
          )}
          {filters.city && (
            <a href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 99, fontSize: 11, color: 'var(--foreground)', fontWeight: 600 }}>
              {filters.city} ×
            </a>
          )}
        </div>
      )}      {/* Two-column layout */}
      <div className="events-layout">
        {/* Filter sidebar */}
        <div className="events-filter-sidebar">
          <Suspense fallback={<div className="panel" style={{ height: 400 }} />}>
            <EventsFilters categories={categories} cities={cities} />
          </Suspense>
        </div>

        {/* Results */}
        <div>
          {result.data.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={24} />}
              title="No events found"
              description={
                filters.search || filters.category || filters.city
                  ? 'Try adjusting your filters or search for something else.'
                  : 'No upcoming events right now. Check back soon.'
              }
              action={{ label: 'Clear filters', href: '/events' }}
            />
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {result.data.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {result.totalPages > 1 && (
                <PaginationWrapper page={page} totalPages={result.totalPages} params={params} />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

// Client pagination wrapper that preserves existing search params
function PaginationWrapper({
  page,
  totalPages,
  params,
}: {
  page: number
  totalPages: number
  params: Record<string, string | string[] | undefined>
}) {
  function buildHref(p: number) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (k !== 'page' && v) sp.set(k, Array.isArray(v) ? (v[0] ?? '') : v)
    })
    sp.set('page', String(p))
    return `/events?${sp.toString()}`
  }

  return (
    <nav aria-label="Pagination" style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <a
            key={p}
            href={buildHref(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            style={{
              display: 'grid', placeItems: 'center',
              width: 34, height: 34,
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              borderColor: p === page ? 'var(--primary)' : 'var(--border)',
              background: p === page ? 'var(--primary)' : 'transparent',
              color: p === page ? 'var(--primary-foreground)' : 'var(--foreground)',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            {p}
          </a>
        ))}
      </div>
    </nav>
  )
}

export function Loading() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </main>
  )
}
