'use client'

import React, { useState, useEffect } from 'react'
import { getWebImageUrl } from '@/lib/cloudinary/imageHelper'

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt?: string
  className?: string
  containerClassName?: string
  aspectRatio?: string
  optimizeWidth?: number
}

export function ProgressiveImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  aspectRatio,
  optimizeWidth,
  loading = 'lazy',
  style,
  ...props
}: ProgressiveImageProps) {
  const [hasError, setHasError] = useState(false)
  const displaySrc = getWebImageUrl(src)

  // Reset error state whenever src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!displaySrc) {
    return (
      <div
        className={`bg-neutral-200/60 dark:bg-neutral-800/60 ${containerClassName}`}
        style={aspectRatio ? { aspectRatio, ...style } : style}
      />
    )
  }

  if (hasError) {
    return (
      <div
        className={`bg-neutral-200/60 dark:bg-neutral-800/60 flex items-center justify-center text-ink-tertiary text-xs p-2 text-center ${containerClassName}`}
        style={aspectRatio ? { aspectRatio, ...style } : style}
      >
        <span className="truncate">Image unavailable</span>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden bg-neutral-200/60 dark:bg-neutral-800/60 ${containerClassName}`}
      style={aspectRatio ? { aspectRatio, ...style } : style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={alt}
        loading={loading}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover block ${className}`}
        style={style}
        {...props}
      />
    </div>
  )
}
