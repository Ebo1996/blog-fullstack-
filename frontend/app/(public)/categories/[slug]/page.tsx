import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventCard } from '@/components/events/event-card'
import { Pagination } from '@/components/ui/pagination'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch { return null }
}

async function getEventsByCategory(slug: string, page = 1) {
  try {
    const res = await fetch(
      `${API_URL}/events?category=${slug}&page=${page}&limit=12&sort=soonest`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return { events: [], meta: { total: 0, page: 1, totalPages: 1 } }
    const data = await res.json()
    return {
      events: data.data?.events ?? data.data ?? [],
      meta: data.data?.meta ?? { total: 0, page: 1, totalPages: 1 },
    }
  } catch { return { events: [], meta: { total: 0, page: 1, totalPages: 1 } } }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = await getCategory(params.slug)
  if (!cat) return { title: 'Category not found' }
  return {
    title: `${cat.name} Events`,
    description: `Discover ${cat.name} events across Ethiopia on Eventify.`,
    openGraph: { title: `${cat.name} Events | Eventify Ethiopia` },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string }
}) {
  const category = await getCategory(params.slug)
  if (!category) notFound()

  const page = Number(searchParams.page ?? 1)
  const { events, meta } = await getEventsByCategory(params.slug, page)

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      {/* Breadcrumb */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All events
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        {category.icon && (
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'var(--muted)' }}
          >
            {category.icon}
          </div>
        )}
        <div>
          <span className="eyebrow block mb-1">Category</span>
          <h1 className="text-serif" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1 }}>
            {category.name}
          </h1>
          {category.description && (
            <p className="text-sm text-[var(--muted-foreground)] mt-2">{category.description}</p>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-[var(--muted-foreground)] mb-6">
        {meta.total} event{meta.total !== 1 ? 's' : ''} in {category.name}
      </p>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            No {category.name} events yet.
          </p>
          <Link href="/events" className="btn btn-primary btn-sm">Browse all events</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map((event: any, i: number) => (
              <EventCard key={event._id} event={event} index={i} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <div className="flex gap-1">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/categories/${params.slug}?page=${p}`}
                    className={`w-8 h-8 rounded-[var(--radius-sm)] text-xs font-medium flex items-center justify-center transition-colors ${
                      p === page
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
