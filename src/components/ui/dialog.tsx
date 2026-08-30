'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      el.showModal()
    } else {
      el.close()
    }
  }, [open])

  React.useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handleClose = () => onClose()
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  // Close on backdrop click
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect()
    if (!rect) return
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    if (clickedOutside) onClose()
  }

  const maxWidth = { sm: 420, md: 560, lg: 720 }[size]

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 0,
        color: 'var(--foreground)',
        maxWidth,
        width: '90vw',
        boxShadow: 'var(--shadow-lg)',
      }}
      className={cn(className)}
    >
      <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h2
            id="dialog-title"
            style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, margin: 0, letterSpacing: '-0.02em' }}
          >
            {title}
          </h2>
          {description && (
            <p id="dialog-description" style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
              {description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{ background: 'none', border: 0, color: 'var(--muted-foreground)', cursor: 'pointer', padding: 4, marginTop: -4 }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: 28 }}>{children}</div>
    </dialog>
  )
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(className)}
      style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end',
        borderTop: '1px solid var(--border)',
        paddingTop: 20,
        marginTop: 20,
      }}
    >
      {children}
    </div>
  )
}
