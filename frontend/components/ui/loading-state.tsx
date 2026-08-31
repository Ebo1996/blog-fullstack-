import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
}

export function LoadingState({
  label = 'Loading…',
  size = 'md',
  className,
  fullPage = false,
}: LoadingStateProps) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-9 h-9' }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-[var(--muted-foreground)]',
        fullPage ? 'min-h-[60vh]' : 'py-16',
        className,
      )}
      role="status"
      aria-label={label}
    >
      <Loader2 className={cn(sizeMap[size], 'animate-spin')} />
      <p className="text-xs">{label}</p>
    </div>
  )
}
