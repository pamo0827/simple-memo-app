'use client'

import { useState, useEffect } from 'react'
import { getDefaultAvatarUrl } from '@/lib/avatar'

interface AvatarProps {
  src?: string | null
  alt?: string
  nickname?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-2xl',
}

export function Avatar({ src, alt, nickname, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [src])

  const displaySrc = src && !imageError ? src : getDefaultAvatarUrl(nickname)
  const sizeClass = sizeClasses[size]

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-amber-100 ${sizeClass} ${className}`}>
      <img
        src={displaySrc}
        alt={alt || nickname || 'User avatar'}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  )
}
