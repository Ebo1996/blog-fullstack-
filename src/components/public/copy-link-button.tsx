'use client'

import { Share2 } from 'lucide-react'

export function CopyLinkButton({ title }: { title: string }) {
  return (
    <button
      className="button button-outline button-sm"
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href)
      }}
      aria-label={`Copy link to ${title}`}
    >
      <Share2 size={12} aria-hidden="true" />
      Copy link
    </button>
  )
}
