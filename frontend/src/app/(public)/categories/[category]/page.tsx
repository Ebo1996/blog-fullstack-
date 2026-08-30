import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { getCategoryBySlug, getAllCategories } from '@/services/categories'
import { getEventsByCategory } from '@/services/events'
import { EventCard } from '@/components/public/event-card'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'

// Force dynamic rendering to ensure cookies() is called in request context
export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params
  const cat = await getCategoryBySlug(category)
  if (!cat) return { title: 'Category not found' }
  return {
    title: `${cat.name} Events`,
    description: cat.description ?? `Browse ${cat.name} events on Northstar.`,
  }
}

// Removed generateStaticParams to avoid cookies() call at build time
// Categories will be generated on-demand instead

// If you want to pre-generate category pages at build time, uncomment this
// and make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment:
// export async function generateStaticParams() {
//   const categories = await getAllCategoriesBuildTime()
//   return categories.map((c) => ({ category: c.slug }))
// }

function getString(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(getString(sp['page']) || '1', 10))

  const [cat, result, allCategories] = await Promise.all([
    getCategoryBySlug(category),
    getEventsByCategory(category, page),
    getAllCategories(),
  ])

  if (!cat) notFound()

  const otherCategories = allCategories.filter((c) => c.slug !== category).slice(0, 8)

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 28 }}>
        <ol
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            listStyle: 'none', padding: 0, margin: 0,
            fontSize: 12, color: 'var(--muted-foreground)',
          }}
        >
          <li>
            <Link href="/events" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={12} aria-hidden="true" /> Events
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight size={11} /></li>
          <li aria-current="page" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            {cat.name}
          </li>
        </ol>
      </nav>

      {/* Two-column layout */}
      <div className="category-layout" style={{ alignItems: 'start' }}>

        {/* ── Main column ─────────────────────────────────────────────── */}
        <div>
          {/* Category header */}
          <div style={{ marginBottom: 32 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>CATEGORY</p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 400, letterSpacing: '-0.03em',
                margin: '0 0 12px',
              }}
            >
              {cat.name}
            </h1>
            {cat.description && (
              <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.65, maxWidth: 600, margin: 0 }}>
                {cat.description}
              </p>
            )}
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginTop: 10 }}>
              {result.count} event{result.count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Grid */}
          {result.data.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={24} />}
              title={`No ${cat.name} events right now`}
              description="New events are added regularly. Check back soon or browse another category."
              action={{ label: 'Browse all events', href: '/events' }}
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

              {/* Pagination */}
              {result.totalPages > 1 && (
                <nav aria-label="Pagination" style={{ marginTop: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                      <a
                        key={p}
                        href={`/categories/${category}?page=${p}`}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                        style={{
                          display: 'grid', placeItems: 'center',
                          width: 34, height: 34, borderRadius: 'var(--radius-md)',
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
              )}
            </>
          )}
        </div>

        {/* ── Sidebar: other categories ────────────────────────────────── */}
        <aside aria-label="Other categories" style={{ position: 'sticky', top: 84 }}>
          <div className="panel">
            <p
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                color: 'var(--muted-foreground)', textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              Other categories
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {otherCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderBottom: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--foreground)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {c.name}
                  <ChevronRight size={13} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <Link
              href="/events"
              className="button button-outline button-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
            >
              All events
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
