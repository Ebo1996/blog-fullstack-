import * as React from 'react'
import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  deltaDirection?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, delta, deltaDirection = 'neutral', icon, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p className="stat-label">{label}</p>
        {icon && (
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              background: 'var(--muted)',
              color: 'var(--primary)',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="stat-value">{value}</p>
      {delta && (
        <p className={cn('stat-delta', deltaDirection)}>
          {deltaDirection === 'up' && <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />}
          {deltaDirection === 'down' && <TrendingDown size={12} style={{ display: 'inline', marginRight: 4 }} />}
          {delta}
        </p>
      )}
    </div>
  )
}
