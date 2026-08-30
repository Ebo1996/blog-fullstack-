import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const iconMap: Record<AlertVariant, React.ReactNode> = {
  info:    <Info size={16} aria-hidden="true" />,
  success: <CheckCircle size={16} aria-hidden="true" />,
  warning: <TriangleAlert size={16} aria-hidden="true" />,
  error:   <AlertCircle size={16} aria-hidden="true" />,
}

const roleMap: Record<AlertVariant, string> = {
  info:    'note',
  success: 'status',
  warning: 'alert',
  error:   'alert',
}

export function Alert({ variant = 'info', title, children, className, style }: AlertProps) {
  return (
    <div
      className={cn('alert', `alert-${variant}`, className)}
      role={roleMap[variant]}
      style={style}
    >
      {iconMap[variant]}
      <div>
        {title && (
          <p style={{ fontWeight: 700, marginBottom: 2, fontSize: 12 }}>{title}</p>
        )}
        <div style={{ fontSize: 12 }}>{children}</div>
      </div>
    </div>
  )
}
