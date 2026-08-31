'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { EventCard } from '@/components/events/event-card'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import { eventsApi } from '@/lib/api/events'
import apiClient from '@/lib/api/client'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'soonest', label: 'Soonest first' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

export function EventsGrid({ searchParams }: { searchParams: Record<string, string> }) {
  const router = useRouter()
  const pathname = usePathname()

  const [events, setEvents] = useState<any[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const [filters, setFilters] = useState({
    search: searchParams.q ?? '',
    category: searchParams.category ?? '',
    city: searchParams.city ?? '',
    sort: searchParams.sort ?? 'soonest',
    priceMin: searchParams.priceMin ?? '',
    priceMax: searchParams.priceMax ?? '',
    availability: searchParams.availability ?? '', // 'available' | 'free' | ''
    page: Number(searchParams.page ?? 1),
  })

  // Load categories for filter dropdown
  useEffect(() => {
    apiClient.get<any>('/categories')
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {})
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        search: filters.search || undefined,
        category: filters.category || undefined,
        city: filters.city || undefined,
        sort: filters.sort,
        priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        page: filters.page,
        limit: 12,
      }
      // availability filter — free = priceMax:0, available = exclude sold-out
      if (filters.availability === 'free') params.priceMax = 0
      if (filters.availability === 'available') params.availability = 'available'

      const res = await eventsApi.list(params)
      const d = res.data as any
      setEvents(d?.events ?? d?.data ?? (Array.isArray(d) ? d : []))
      setMeta(d?.meta ?? { total: 0, page: 1, totalPages: 1 })
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const updateUrl = (newFilters: typeof filters) => {
    const p = new URLSearchParams()
    if (newFilters.search) p.set('q', newFilters.search)
    if (newFilters.category) p.set('category', newFilters.category)
    if (newFilters.city) p.set('city', newFilters.city)
    if (newFilters.sort !== 'soonest') p.set('sort', newFilters.sort)
    if (newFilters.priceMin) p.set('priceMin', newFilters.priceMin)
    if (newFilters.priceMax) p.set('priceMax', newFilters.priceMax)
    if (newFilters.availability) p.set('availability', newFilters.availability)
    if (newFilters.page > 1) p.set('page', String(newFilters.page))
    router.push(`${pathname}?${p.toString()}`, { scroll: false })
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const updated = { ...filters, page: 1 }
    setFilters(updated)
    updateUrl(updated)
  }

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...filters, [key]: value, page: 1 }
    setFilters(updated as typeof filters)
    updateUrl(updated as typeof filters)
  }

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page }
    setFilters(updated)
    updateUrl(updated)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    const reset = {
      search: '', category: '', city: '', sort: 'soonest',
      priceMin: '', priceMax: '', availability: '', page: 1,
    }
    setFilters(reset)
    router.push(pathname)
  }

  const hasActiveFilters =
    filters.search || filters.category || filters.city ||
    filters.priceMin || filters.priceMax || filters.availability ||
    filters.sort !== 'soonest'

  return (
    <div>
      {/* ── Search + sort bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <label className="flex items-center gap-2 input-field flex-1" style={{ height: 42 }}>
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search events…"
              className="flex-1 bg-transparent outline-none text-xs"
              aria-label="Search events"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <div className="flex gap-2">
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="input-field text-xs"
            style={{ height: 42, width: 'auto', minWidth: 160 }}
            aria-label="Sort events"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline btn-sm gap-2 ${showFilters ? 'bg-[var(--muted)]' : ''}`}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* ── Expanded filter panel ─────────────────────────────── */}
      {showFilters && (
        <div id="filter-panel" className="card p-5 mb-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category */}
            <div className="input-group">
              <label className="input-label" htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-field text-xs"
                style={{ height: 42 }}
              >
                <option value="">All categories</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat.slug}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="input-group">
              <label className="input-label" htmlFor="filter-city">City</label>
              <input
                id="filter-city"
                className="input-field"
                placeholder="e.g. Addis Ababa"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            {/* Availability */}
            <div className="input-group">
              <label className="input-label" htmlFor="filter-availability">Availability</label>
              <select
                id="filter-availability"
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="input-field text-xs"
                style={{ height: 42 }}
              >
                <option value="">Any</option>
                <option value="available">Available only</option>
                <option value="free">Free events</option>
              </select>
            </div>

            {/* Price min */}
            <div className="input-group">
              <label className="input-label" htmlFor="filter-price-min">Min price (ETB)</label>
              <input
                id="filter-price-min"
                type="number"
                className="input-field"
                placeholder="0"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
              />
            </div>

            {/* Price max */}
            <div className="input-group">
              <label className="input-label" htmlFor="filter-price-max">Max price (ETB)</label>
              <input
                id="filter-price-max"
                type="number"
                className="input-field"
                placeholder="Any"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={clearFilters} className="btn btn-ghost btn-sm text-[var(--muted-foreground)]">
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* ── Active filter chips ───────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => handleFilterChange('search', '')} />}
          {filters.category && (
            <Chip
              label={categories.find((c: any) => c.slug === filters.category)?.name ?? filters.category}
              onRemove={() => handleFilterChange('category', '')}
            />
          )}
          {filters.city && <Chip label={filters.city} onRemove={() => handleFilterChange('city', '')} />}
          {filters.availability && <Chip label={filters.availability === 'free' ? 'Free events' : 'Available only'} onRemove={() => handleFilterChange('availability', '')} />}
          {filters.sort !== 'soonest' && (
            <Chip label={SORT_OPTIONS.find(o => o.value === filters.sort)?.label ?? filters.sort} onRemove={() => handleFilterChange('sort', 'soonest')} />
          )}
          <button onClick={clearFilters} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline">
            Clear all
          </button>
        </div>
      )}

      {/* ── Results count ─────────────────────────────────────── */}
      <p className="text-xs text-[var(--muted-foreground)] mb-5">
        {loading ? 'Loading…' : `${meta.total} event${meta.total !== 1 ? 's' : ''} found`}
      </p>

      {/* ── Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-video" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No events found"
          description="Try adjusting your search or filters"
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.map((event: any, i: number) => (
            <EventCard key={event._id} event={event} index={i} />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────── */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center mt-10">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-[var(--border)] bg-[var(--muted)]">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`}>
        <X className="w-3 h-3 text-[var(--muted-foreground)]" />
      </button>
    </span>
  )
}
