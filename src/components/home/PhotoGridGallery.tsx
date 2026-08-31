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
  Heart,
  MapPin,
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

      {/* 2x3 Photo Grid Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4.5 w-full">
        {gridPhotos.map((photo, index) => {
          const photoLike =
            mounted && likesMap[photo.id]
              ? likesMap[photo.id]
              : {
                  liked: false,
                  count: Number(photo.like_count) || 0,
                }

          return (
            <div
              key={photo.id}
              onClick={() => setActivePhotoIndex(index)}
              className="
                group relative aspect-square rounded-2xl overflow-hidden
                cursor-pointer bg-neutral-200 dark:bg-neutral-800
                border border-hairline shadow-2xs hover:shadow-lg
                transition-all duration-300 select-none
              "
              title="Click to view full photograph"
            >
              <ProgressiveImage
                src={photo.src}
                alt={photo.alt}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-104"
                loading="lazy"
              />

              {/* Persistent Like Badge on Tile */}
              {photoLike.count > 0 && (
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-pill text-[11px] font-bold bg-black/65 text-white backdrop-blur-xs z-10 flex items-center gap-1">
                  <Heart className={`w-3 h-3 ${photoLike.liked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                  <span>{photoLike.count}</span>
                </div>
              )}

              {/* Overlay: Natural subtle gradient */}
              <div
                className="
                  absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4.5
                  bg-gradient-to-t from-black/80 via-black/20 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  pointer-events-none z-10
                "
              >
                {photo.title && (
                  <p className="text-white text-xs sm:text-sm font-semibold mb-1 leading-snug drop-shadow-sm truncate">
                    {photo.title}
                  </p>
                )}
                {photo.location && (
                  <div className="flex items-center gap-1 text-white/90 text-[11px] sm:text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-accent-red" />
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
