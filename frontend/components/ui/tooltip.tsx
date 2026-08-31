'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--card)] border-l-transparent border-r-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--card)] border-l-transparent border-r-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--card)] border-t-transparent border-b-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--card)] border-t-transparent border-b-transparent border-l-transparent border-4',
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium whitespace-nowrap pointer-events-none',
            'bg-[var(--card)] border border-[var(--border)] shadow-lg text-[var(--foreground)]',
            positionClasses[side],
            className,
          )}
        >
          {content}
          <span className={cn('absolute', arrowClasses[side])} />
        </span>
      )}
    </span>
  )
}
