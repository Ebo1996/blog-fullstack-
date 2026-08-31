import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function EventCardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-video w-full rounded-t-[var(--radius-lg)]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function TicketCardSkeleton() {
  return (
    <div className="ticket-card">
      <Skeleton className="w-[38%] rounded-tl-[var(--radius-lg)] rounded-bl-[var(--radius-lg)]" />
      <div className="p-5 flex-1 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
