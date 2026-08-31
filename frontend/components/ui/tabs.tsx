'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

// ── Context ───────────────────────────────────────────────────────
interface TabsContextType {
  active: string
  setActive: (v: string) => void
}
const TabsContext = createContext<TabsContextType | null>(null)
function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs subcomponents must be used inside <Tabs>')
  return ctx
}

// ── Root ──────────────────────────────────────────────────────────
interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
  onChange?: (value: string) => void
}
export function Tabs({ defaultValue, children, className, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultValue)
  const handleChange = (v: string) => {
    setActive(v)
    onChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ active, setActive: handleChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

// ── List ──────────────────────────────────────────────────────────
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Trigger ───────────────────────────────────────────────────────
interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}
export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { active, setActive } = useTabsContext()
  const isActive = active === value
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      onClick={() => setActive(value)}
      className={cn(
        'px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
        isActive
          ? 'text-[var(--foreground)] border-[var(--primary)]'
          : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:border-[var(--border)]',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ── Content ───────────────────────────────────────────────────────
interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}
export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useTabsContext()
  if (active !== value) return null
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn('pt-5 animate-fade-in', className)}
    >
      {children}
    </div>
  )
}
