'use client'

import { useEffect, useState } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { eventsApi } from '@/lib/api/events'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import apiClient from '@/lib/api/client'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    eventsApi.getCategories()
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await apiClient.post('/categories', { name, icon, slug: slug || undefined })
      toast.success('Category created')
      setName(''); setIcon(''); setSlug('')
      setShowForm(false)
      load()
    } catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Categories</h1>
        </div>
        <div className="topbar-actions">
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" /> Add category
          </button>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        {showForm && (
          <form onSubmit={handleCreate} className="panel space-y-4 mb-6 animate-fade-in">
            <h3 className="font-semibold text-sm">New category</h3>
            <Input label="Name *" placeholder="e.g. Music" value={name} onChange={(e: any) => setName(e.target.value)} />
            <Input label="Icon (emoji)" placeholder="🎵" value={icon} onChange={(e: any) => setIcon(e.target.value)} />
            <Input label="Slug (auto-generated if empty)" placeholder="music" value={slug} onChange={(e: any) => setSlug(e.target.value)} />
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="panel flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="skeleton h-4 w-32" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Tag} title="No categories" description="Create event categories to help users browse." />
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat._id} className="panel flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-lg flex-shrink-0">
                  {cat.icon ?? '🏷️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{cat.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">/{cat.slug}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{cat.eventCount ?? 0} events</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
