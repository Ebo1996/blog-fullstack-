'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'
import type { EventAnalytics } from '@/services/organizer'

// ─── Shared tooltip style ─────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--foreground)',
  },
  itemStyle: { color: 'var(--foreground)' },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: 4 },
}

const COLORS = [
  '#7c6af5', '#d7f36a', '#6baee0', '#d8ae62',
  '#c8e76b', '#e06b9a', '#6be0b4', '#e06b6b',
]

// ─── Sales over time (area chart) ─────────────────────────────────────────────
export function SalesOverTimeChart({
  data,
}: {
  data: EventAnalytics['salesOverTime']
}) {
  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
        No sales data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c6af5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c6af5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickFormatter={(d: string) => {
            const [, m, day] = d.split('-')
            return `${m}/${day}`
          }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, name: string) => [
            name === 'revenue' ? formatCurrency(value) : value,
            name === 'revenue' ? 'Revenue' : 'Tickets',
          ]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#7c6af5"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#7c6af5' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Tickets sold per type (bar chart) ────────────────────────────────────────
export function SalesByTypeChart({
  data,
}: {
  data: EventAnalytics['salesByType']
}) {
  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
        No sales data yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name,
    sold: d.sold,
    remaining: d.remaining,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="sold"      name="Sold"      fill="#7c6af5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="remaining" name="Remaining" fill="var(--muted)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Revenue by ticket type (pie / donut) ─────────────────────────────────────
export function RevenueByTypeChart({
  data,
}: {
  data: EventAnalytics['salesByType']
}) {
  const pieData = data
    .filter((d) => d.revenue > 0)
    .map((d) => ({ name: d.name, value: d.revenue }))

  if (pieData.length === 0) {
    return (
      <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
        No revenue data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {pieData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
