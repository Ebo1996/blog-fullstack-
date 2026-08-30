import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'muted' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'button-primary',
  ghost: 'button-ghost',
  outline: 'button-outline',
  muted: 'button-muted',
  danger: 'button-danger',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'button-sm',
  md: '',
  lg: 'button-lg',
  icon: 'button-icon',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn('button', variantClass[variant], sizeClass[size], className)}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ width: 15, height: 15 }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="32"
              strokeDashoffset="12"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
