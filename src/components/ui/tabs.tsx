'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('tabs', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          className={cn('tab-item', activeTab === tab.id && 'active')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              style={{
                marginLeft: 6,
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
                color: activeTab === tab.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                borderRadius: 'var(--radius-full)',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (activeTab !== id) return null
  return (
    <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  )
}
