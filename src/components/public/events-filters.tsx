'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { EventCategory } from '@/types/database'

interface EventsFiltersProps {
  categories: EventCategory[]
  cities: string[]
}

export function EventsFilters({ categories, cities }: EventsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = {
    search:   searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    city:     searchParams.get('city') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo:   searchParams.get('dateTo') ?? '',
    sort:     searchParams.get('sort') ?? 'date_asc',
  }

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams],
  )

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [router, pathname])

  const hasActiveFilters =
    current.category || current.city || current.dateFrom || current.dateTo

  return (
    <aside
      aria-label="Filter events"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        position: 'sticky',
        top: 80,
        height: 'fit-content',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
          <SlidersHorizontal size={14} aria-hidden="true" />
          Filters
          {isPending && (
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Updating…</span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            aria-label="Clear all filters"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--primary)', fontWeight: 600,
              background: 'none', border: 0, cursor: 'pointer', padding: 0,
            }}
          >
            <X size={11} aria-hidden="true" /> Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label" htmlFor="filter-sort">Sort by</label>
        <select
          id="filter-sort"
          className="form-select"
          value={current.sort}
          onChange={(e) => update('sort', e.target.value)}
        >
          <option value="date_asc">Date: soonest first</option>
          <option value="date_desc">Date: latest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {/* Category */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label" htmlFor="filter-category">Category</label>
        <select
          id="filter-category"
          className="form-select"
          value={current.category}
          onChange={(e) => update('category', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* City */}
      {cities.length > 0 && (
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" htmlFor="filter-city">City</label>
          <select
            id="filter-city"
            className="form-select"
            value={current.city}
            onChange={(e) => update('city', e.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date range */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="filter-from">From date</label>
        <input
          id="filter-from"
          type="date"
          className="form-input"
          value={current.dateFrom}
          onChange={(e) => update('dateFrom', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="filter-to">To date</label>
        <input
          id="filter-to"
          type="date"
          className="form-input"
          value={current.dateTo}
          onChange={(e) => update('dateTo', e.target.value)}
        />
      </div>
    </aside>
  )
}

// ─── Compact top toolbar (mobile + above-grid on desktop) ────────────────────
export function EventsSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentSearch = searchParams.get('search') ?? ''

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const val = (fd.get('search') as string).trim()
    const params = new URLSearchParams(searchParams.toString())
    if (val) { params.set('search', val) } else { params.delete('search') }
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="Search events" style={{ display: 'flex', gap: 8 }}>
      <input
        name="search"
        type="search"
        defaultValue={currentSearch}
        placeholder="Search events, venues, cities…"
        className="form-input"
        style={{ flex: 1 }}
        aria-label="Search events"
      />
      <button type="submit" className="button button-primary" style={{ flexShrink: 0 }}>
        Search
      </button>
    </form>
  )
}
