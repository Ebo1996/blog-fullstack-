import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EventsGrid } from '../events/events-grid'

export const metadata: Metadata = {
  title: 'Search Events',
  description: 'Search events across Ethiopia on Eventify.',
}

export default function SearchPage({ searchParams }: { searchParams: Record<string, string> }) {
  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="mb-8">
        <span className="eyebrow">Search results</span>
        <h1 className="text-serif" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginTop: 6 }}>
          {searchParams.q ? `Results for "${searchParams.q}"` : 'Search events'}
        </h1>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
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
      }>
        <EventsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
