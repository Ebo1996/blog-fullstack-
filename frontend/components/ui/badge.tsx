import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  dot?: boolean
  className?: string
}

export function Badge({ children, variant = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}
