import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EventsGrid } from './events-grid'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover events across Ethiopia — concerts, conferences, workshops, festivals and more.',
}

export default function EventsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="mb-8">
        <span className="eyebrow">All events</span>
        <h1 className="text-serif" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginTop: 6 }}>
          Find your next experience
        </h1>
      </div>
      <Suspense fallback={<EventsGridSkeleton />}>
        <EventsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function EventsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-video" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
