'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="input-group">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <input
        ref={ref}
        id={id}
        className={cn('input-field', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="input-error">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="input-group">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <textarea
        ref={ref}
        id={id}
        className={cn('textarea-field', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="input-error">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
