'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = (): Array<number | '...'> => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: Array<number | '...'> = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(className)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', padding: '16px 0' }}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', background: 'transparent',
          color: page === 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
          cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1,
        }}
      >
        <ChevronLeft size={14} />
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'var(--muted-foreground)', fontSize: 12, padding: '0 4px' }}>
            ···
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600,
              border: '1px solid transparent', cursor: 'pointer',
              background: p === page ? 'var(--primary)' : 'transparent',
              color: p === page ? 'var(--primary-foreground)' : 'var(--foreground)',
              borderColor: p === page ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', background: 'transparent',
          color: page === totalPages ? 'var(--muted-foreground)' : 'var(--foreground)',
          cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1,
        }}
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
