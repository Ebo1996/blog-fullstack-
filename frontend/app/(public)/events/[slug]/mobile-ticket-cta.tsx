'use client'

interface MobileTicketCTAProps {
  eventTitle: string
  minPrice: number
  hasFreeTickets: boolean
}

export function MobileTicketCTA({ eventTitle, minPrice, hasFreeTickets }: MobileTicketCTAProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('tickets-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">{eventTitle}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {hasFreeTickets ? 'Free' : `From ETB ${minPrice.toLocaleString()}`}
        </p>
      </div>
      <a
        href="#tickets-panel"
        className="btn btn-primary btn-sm flex-shrink-0"
        onClick={handleClick}
      >
        Get tickets
      </a>
    </div>
  )
}
