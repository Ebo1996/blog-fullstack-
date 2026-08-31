import { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="input-group">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'input-field w-full appearance-none pr-8',
              error ? 'border-[var(--destructive)]' : '',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--muted-foreground)] mt-1">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[var(--destructive)] mt-1">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
