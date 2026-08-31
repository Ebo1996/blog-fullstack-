import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
      <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-[var(--destructive)]" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-[var(--muted-foreground)] text-xs mt-1 max-w-xs">{description}</p>
      </div>
      {action && (
        action.href ? (
          <Link href={action.href} className="btn btn-outline btn-sm">{action.label}</Link>
        ) : (
          <button onClick={action.onClick} className="btn btn-outline btn-sm">{action.label}</button>
        )
      )}
    </div>
  )
}
