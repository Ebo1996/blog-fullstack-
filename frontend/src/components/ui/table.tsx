import * as React from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  width?: string | number
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('data-table-wrapper', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} aria-hidden="true">
                {columns.map((col) => (
                  <td key={col.key}>
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: '70%' }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                {emptyState ?? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
                    No records found
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
