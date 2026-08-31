'use client'

import React, { useState, useEffect } from 'react'
import { getWebImageUrl, ImageProfile } from '@/lib/cloudinary/imageHelper'

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt?: string
  className?: string
  containerClassName?: string
  aspectRatio?: string
  optimizeWidth?: number
  profile?: ImageProfile
}

export function ProgressiveImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  aspectRatio,
  optimizeWidth,
  profile,
  loading = 'lazy',
  style,
  ...props
}: ProgressiveImageProps) {
  const [hasError, setHasError] = useState(false)
  const [useFallbackOriginal, setUseFallbackOriginal] = useState(false)
  
  const displaySrc = useFallbackOriginal ? src : getWebImageUrl(src, profile, optimizeWidth)

  // Reset error state whenever src changes
  useEffect(() => {
    setHasError(false)
    setUseFallbackOriginal(false)
  }, [src])

  if (!src) {
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
        <span className="truncate">{alt || 'Image unavailable'}</span>
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
        onError={() => {
          if (!useFallbackOriginal && displaySrc !== src) {
            setUseFallbackOriginal(true)
          } else {
            setHasError(true)
          }
        }}
        className={`w-full h-full object-cover block ${className}`}
        style={style}
        {...props}
      />
    </div>
  )
}
