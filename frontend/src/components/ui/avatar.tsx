import * as React from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils/format'
import Image from 'next/image'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
}

const sizeMap: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 40, xl: 56 }
const fontSizeMap: Record<AvatarSize, number> = { sm: 9, md: 11, lg: 13, xl: 16 }

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const px = sizeMap[size]
  const fs = fontSizeMap[size]
  const initials = getInitials(name)

  if (src) {
    return (
      <div
        className={cn('avatar', className)}
        style={{ width: px, height: px }}
        aria-label={name ?? undefined}
      >
        <Image
          src={src}
          alt={name ?? 'User avatar'}
          width={px}
          height={px}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('avatar', className)}
      style={{ width: px, height: px, fontSize: fs }}
      aria-label={name ?? 'User'}
      role="img"
    >
      {initials}
    </div>
  )
}
