'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { NepalPhoto } from '@/lib/data/nepalImages'
import { GalleryPhotoRecord } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'
import { ImageViewerModal } from '@/components/common/ImageViewerModal'
import { getStoredLikedIds, isPhotoLikedLocally } from '@/lib/gallery/likeHelper'
import {
  Sparkles,
  Images,
  ArrowRight,
} from 'lucide-react'

interface PhotoGridGalleryProps {
  title?: string
  subtitle?: string
  badgeText?: string
  badgeTone?: 'neutral' | 'red' | 'blue'
  photos: (NepalPhoto | GalleryPhotoRecord | any)[]
  className?: string
}

export function PhotoGridGallery({
  title = 'Glimpses of Nepal',
  subtitle = 'Fleeting moments, trail memories, and sacred spaces captured across the Himalayas.',
  badgeText = 'Gallery',
  badgeTone = 'red',
  photos = [],
  className = '',
}: PhotoGridGalleryProps) {
  const gridPhotos = (photos || []).slice(0, 6).map((p, idx) => ({
    id: p.id || `home-grid-${idx}`,
    src: p.image_url || p.src,
    title: p.title || '',
    caption: p.description || p.caption || p.title || '',
    location: p.location || '',
    alt: p.seo_alt || p.alt_text || p.alt || p.title || 'Photograph of Nepal',
    like_count: p.like_count || 0,
    slot: 'home_grid',
  }))

  const [mounted, setMounted] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [likesMap, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>({})

  useEffect(() => {
    setMounted(true)
    const stored = getStoredLikedIds()
    const initial: Record<string, { liked: boolean; count: number }> = {}
    gridPhotos.forEach((p) => {
      initial[p.id] = {
        liked: stored.has(p.id),
        count: Number(p.like_count) || 0,
      }
    })
    setLikesMap(initial)
  }, [photos])

  useEffect(() => {
    const handleSync = (e: Event) => {
      const { photoId, liked, count } = (e as CustomEvent).detail || {}
      if (photoId) {
        setLikesMap((prev) => ({
          ...prev,
          [photoId]: {
            liked: liked !== undefined ? liked : isPhotoLikedLocally(photoId),
            count: Number(count) || 0,
          },
        }))
      }
    }

    window.addEventListener('gallery_like_sync', handleSync)
    return () => window.removeEventListener('gallery_like_sync', handleSync)
  }, [])

  if (!gridPhotos || gridPhotos.length === 0) return null

  return (
    <section className={`space-y-5 py-3 sm:py-6 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hairline pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone={badgeTone}>
              <Sparkles className="w-3 h-3 mr-1" />
              {badgeText}
            </Badge>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        <Link
          href="/gallery"
          className="
            inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-pill
            border border-hairline bg-bg-elevated hover:bg-bg
            text-ink text-xs font-semibold hover:border-hairline-strong
            transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer flex-shrink-0 self-start sm:self-auto
          "
        >
          <Images className="w-3.5 h-3.5 text-accent-blue" />
          <span>View Gallery</span>
          <ArrowRight className="w-3.5 h-3.5 text-ink-tertiary" />
        </Link>
      </div>

      {/* 2x3 Photo Grid Gallery matching exact template */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[14px] w-full">
        {gridPhotos.map((photo, index) => {
          const descText = photo.caption || photo.title
          return (
            <div
              key={photo.id}
              onClick={() => setActivePhotoIndex(index)}
              className="group relative aspect-square rounded-[10px] overflow-hidden cursor-pointer bg-[#ddd] dark:bg-[#222] select-none"
              title="Click to view full photograph"
            >
              {/* Full Bleed Image with 0.6s cubic-bezier zoom */}
              <ProgressiveImage
                src={photo.src}
                alt={photo.alt}
                profile="thumb"
                containerClassName="w-full h-full"
                className="w-full h-full object-cover block transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                loading="lazy"
              />

              {/* Overlay: Hidden by default, fades + slides up on hover */}
              <div
                className="
                  absolute inset-0 flex flex-col justify-end p-4
                  opacity-0 group-hover:opacity-100 transition-opacity duration-350
                  pointer-events-none z-10
                "
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)',
                }}
              >
                {descText && (
                  <p className="text-white text-[14px] font-[500] m-0 mb-[6px] translate-y-[6px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-350 delay-[50ms] line-clamp-1 leading-snug drop-shadow-sm">
                    {descText}
                  </p>
                )}
                {photo.location && (
                  <div className="flex items-center gap-[5px] text-white/85 text-[12px] translate-y-[6px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-350 delay-[100ms]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[12px] h-[12px] flex-shrink-0 text-white/85">
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 12 8 12s8-6.6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
                    </svg>
                    <span className="truncate">{photo.location}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FULL-VIEW LIGHTBOX MODAL (ZERO CROP ACROSS ALL ASPECT RATIOS) */}
      <ImageViewerModal
        photos={gridPhotos}
        initialIndex={activePhotoIndex ?? 0}
        isOpen={activePhotoIndex !== null}
        onClose={() => setActivePhotoIndex(null)}
      />
    </section>
  )
}
