import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[var(--muted)] flex items-center justify-center">
          <Icon className="w-6 h-6 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div>
        <p className="font-semibold text-sm">{title}</p>
        {description && <p className="text-[var(--muted-foreground)] text-xs mt-1 max-w-xs">{description}</p>}
      </div>
      {action && (
        action.href ? (
          <Link href={action.href} className="btn btn-primary btn-sm">{action.label}</Link>
        ) : (
          <button onClick={action.onClick} className="btn btn-primary btn-sm">{action.label}</button>
        )
      )}
    </div>
  )
}
