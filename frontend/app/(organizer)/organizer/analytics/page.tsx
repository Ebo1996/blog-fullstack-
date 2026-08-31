'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Ticket, DollarSign, Users, QrCode } from 'lucide-react'
import { analyticsApi } from '@/lib/api/analytics'
import { eventsApi } from '@/lib/api/events'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrganizerAnalyticsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [overview, setOverview] = useState<any>(null)
  const [eventData, setEventData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.organizerOverview(),
      eventsApi.myEvents({ limit: 100, status: 'published' }),
    ]).then(([ovRes, evRes]) => {
      setOverview(ovRes.data)
      const evs = evRes.data?.events ?? evRes.data ?? []
      setEvents(evs)
      if (evs.length > 0) setSelectedEvent(evs[0]._id)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    analyticsApi.eventAnalytics(selectedEvent)
      .then((r) => setEventData(r.data))
      .catch(() => {})
  }, [selectedEvent])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Analytics</h1>
        </div>
      </header>

      <div className="page-content">
        {/* Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Ticket, label: 'Tickets sold', value: loading ? '—' : (overview?.ticketsSold ?? 0).toLocaleString(), color: 'text-blue-400' },
            { icon: DollarSign, label: 'Gross revenue', value: loading ? '—' : formatCurrency(overview?.revenue?.gross ?? 0, 'ETB'), color: 'text-[var(--primary)]', small: true },
            { icon: BarChart3, label: 'Total orders', value: loading ? '—' : (overview?.orders?.total ?? 0).toLocaleString(), color: 'text-purple-400' },
            { icon: QrCode, label: 'Check-ins', value: loading ? '—' : (overview?.checkIns ?? 0).toLocaleString(), color: 'text-green-400' },
          ].map(({ icon: Icon, label, value, color, small }) => (
            <div key={label} className="panel stat-card">
              <div className={`w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="stat-value" style={{ fontSize: small ? 18 : 32 }}>{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Event-level analytics */}
        {events.length > 0 && (
          <div className="panel mb-6">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">EVENT BREAKDOWN</span>
                <h2>Per-event analytics</h2>
              </div>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="input-field text-xs"
                style={{ height: 36, width: 'auto', minWidth: 200 }}
              >
                {events.map((e) => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
            </div>

            {eventData && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Tickets sold', value: eventData.ticketsSold ?? 0 },
                  { label: 'Revenue', value: formatCurrency(eventData.revenue ?? 0, 'ETB'), small: true },
                  { label: 'Checked in', value: eventData.checkIns ?? 0 },
                  { label: 'Remaining', value: eventData.ticketsRemaining ?? 0 },
                ].map(({ label, value, small }) => (
                  <div key={label} className="rounded-[var(--radius-md)] border border-[var(--border)] p-4">
                    <p className="stat-value" style={{ fontSize: small ? 16 : 28 }}>{value}</p>
                    <p className="stat-label mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sales over time bar chart */}
            {eventData?.salesOverTime?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-4 tracking-wider">SALES OVER TIME</h3>
                <SalesChart data={eventData.salesOverTime} />
              </div>
            )}

            {/* Ticket type breakdown */}
            {eventData?.ticketTypes?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-3 tracking-wider">TICKET TYPES</h3>
                <div className="space-y-3">
                  {eventData.ticketTypes.map((tt: any) => {
                    const pct = tt.quantity > 0 ? Math.round((tt.soldQuantity / tt.quantity) * 100) : 0
                    return (
                      <div key={tt._id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium">{tt.name}</span>
                          <span className="text-[var(--muted-foreground)]">{tt.soldQuantity}/{tt.quantity} sold ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming events */}
        {overview?.upcomingEvents?.length > 0 && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">UPCOMING</span>
                <h2>Next events</h2>
              </div>
            </div>
            <div>
              {overview.upcomingEvents.map((ev: any, i: number) => (
                <div key={ev._id} className={`flex items-center gap-4 py-3 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{ev.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatDate(ev.startAt)}</p>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">{ev.ticketsSold ?? 0} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sales over time bar chart (pure CSS, no library) ───────────────
function SalesChart({ data }: { data: { _id: string; revenue: number; orders: number }[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const last14 = data.slice(-14)

  return (
    <div>
      {/* Bars */}
      <div className="flex items-end gap-1 h-32" aria-label="Sales over time chart">
        {last14.map((d) => {
          const pct = Math.round((d.revenue / maxRevenue) * 100)
          return (
            <div
              key={d._id}
              className="flex-1 flex flex-col items-center gap-1 group relative"
              title={`${d._id}: ${d.orders} orders · ETB ${d.revenue.toLocaleString()}`}
            >
              <div
                className="w-full rounded-t-sm bg-[var(--primary)] opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-sm)] px-2 py-1.5 text-[10px] whitespace-nowrap shadow-lg">
                  <p className="font-semibold">{d._id}</p>
                  <p className="text-[var(--muted-foreground)]">{d.orders} orders</p>
                  <p className="text-[var(--primary)]">ETB {d.revenue.toLocaleString()}</p>
                </div>
                <div className="w-2 h-2 bg-[var(--card)] border-r border-b border-[var(--border)] rotate-45 -mt-1" />
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels — show every 3rd */}
      <div className="flex gap-1 mt-2">
        {last14.map((d, i) => (
          <div key={d._id} className="flex-1 text-center">
            {i % 3 === 0 && (
              <span className="text-[9px] text-[var(--muted-foreground)]">
                {d._id.slice(5)} {/* MM-DD */}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Summary */}
      <div className="flex gap-6 mt-3">
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">Total orders (shown)</p>
          <p className="text-sm font-bold">{last14.reduce((s, d) => s + d.orders, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">Total revenue (shown)</p>
          <p className="text-sm font-bold">ETB {last14.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
