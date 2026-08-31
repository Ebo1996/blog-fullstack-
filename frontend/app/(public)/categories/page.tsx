import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse events by category on Eventify Ethiopia.',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

const COLORS = ['#4b455f', '#735c35', '#3e6460', '#6b3a4a', '#3a3f6e', '#4a5240', '#5c3d2e', '#2e4a5c']

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="max-w-7xl mx-auto px-5 py-16">
      <div className="mb-10">
        <span className="eyebrow mb-3 block">Explore</span>
        <h1 className="text-serif" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>All categories</h1>
      </div>

      {categories.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No categories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat: any, i: number) => (
            <Link
              key={cat._id}
              href={`/categories/${cat.slug}`}
              className="card card-hover group flex flex-col items-center justify-center gap-4 py-10 text-center transition-all"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                style={{ background: COLORS[i % COLORS.length] }}
              >
                {cat.icon ?? '🏷️'}
              </div>
              <div>
                <p className="font-semibold text-sm">{cat.name}</p>
                {cat.eventCount != null && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{cat.eventCount} events</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
