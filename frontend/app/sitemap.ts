import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventify.et'
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:3001/api'

export const revalidate = 3600 // regenerate sitemap every hour

async function getEventSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/events?limit=500&status=published&fields=slug`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const events: any[] = data?.data?.events ?? data?.data ?? []
    return events.map((e: any) => e.slug).filter(Boolean)
  } catch {
    return []
  }
}

async function getCategorySlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    const cats: any[] = data?.data ?? []
    return cats.map((c: any) => c.slug).filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventSlugs, categorySlugs] = await Promise.all([
    getEventSlugs(),
    getCategorySlugs(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/events`,             lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/categories`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/about`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/contact`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const eventPages: MetadataRoute.Sitemap = eventSlugs.map((slug) => ({
    url: `${SITE_URL}/events/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/categories/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...eventPages, ...categoryPages]
}
