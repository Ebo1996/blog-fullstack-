'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'

export function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (city.trim()) params.set('city', city.trim())
    router.push(`/events?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search events"
      className="home-search-form"
    >
      <label htmlFor="home-search-q" className="sr-only">Search events</label>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 18px', gap: 10, borderRight: '1px solid var(--border)' }}>
        <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} aria-hidden="true" />
        <input
          id="home-search-q"
          type="search"
          placeholder="Search events, artists, venues…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: 0, outline: 0, background: 'transparent',
            color: 'var(--foreground)', fontSize: 14, width: '100%',
            padding: '14px 0',
          }}
        />
      </div>
      <label htmlFor="home-search-city" className="sr-only">City</label>
      <div className="home-search-city" style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
        <MapPin size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} aria-hidden="true" />
        <input
          id="home-search-city"
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{
            border: 0, outline: 0, background: 'transparent',
            color: 'var(--foreground)', fontSize: 14, width: '100%',
            padding: '14px 0',
          }}
        />
      </div>
      <button
        type="submit"
        className="button button-primary home-search-btn"
        aria-label="Search"
      >
        Search
      </button>
    </form>
  )
}
