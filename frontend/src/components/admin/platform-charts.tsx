'use client'

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'
import type { PlatformAnalytics } from '@/services/admin'

const tooltipStyle = {
  contentStyle: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--foreground)',
  },
  itemStyle:  { color: 'var(--foreground)' },
  labelStyle: { color: 'var(--muted-foreground)', marginBottom: 4 },
}

const PIE_COLORS = ['#e06b9a', '#d7f36a', '#7c6af5', '#6baee0', '#d8ae62']

// ─── User growth (area chart, dual series) ───────────────────────────────────
export function UserGrowthChart({ data }: { data: PlatformAnalytics['userGrowth'] }) {
  if (data.length === 0) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#e06b9a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e06b9a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="orgsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c6af5" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7c6af5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="users"       name="Users"       stroke="#e06b9a" strokeWidth={2} fill="url(#usersGrad)" dot={false} />
        <Area type="monotone" dataKey="organizers"  name="Organizers"  stroke="#7c6af5" strokeWidth={2} fill="url(#orgsGrad)"  dot={false} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Revenue over time (area chart) ──────────────────────────────────────────
export function RevenueOverTimeChart({ data }: { data: PlatformAnalytics['revenueOverTime'] }) {
  if (data.length === 0) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#e06b9a" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#e06b9a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, name: string) => [
            name === 'revenue' ? formatCurrency(value) : value,
            name === 'revenue' ? 'Revenue' : 'Orders',
          ]}
        />
        <Area type="monotone" dataKey="revenue" name="revenue" stroke="#e06b9a" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Orders per month (bar chart) ────────────────────────────────────────────
export function OrdersBarChart({ data }: { data: PlatformAnalytics['revenueOverTime'] }) {
  if (data.length === 0) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="orders" name="Orders" fill="#e06b9a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Events by status (pie) ───────────────────────────────────────────────────
export function EventsByStatusChart({ data }: { data: PlatformAnalytics['eventsByStatus'] }) {
  const pieData = data.filter((d) => d.count > 0)
  if (pieData.length === 0) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="status">
          {pieData.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Monthly orders line chart ────────────────────────────────────────────────
export function MonthlyOrdersLine({ data }: { data: PlatformAnalytics['revenueOverTime'] }) {
  if (data.length === 0) return <ChartEmpty />
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey="orders" name="Orders" stroke="#d7f36a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function ChartEmpty() {
  return (
    <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
      No data yet
    </div>
  )
}
