'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdSlot } from '@/components/ads/AdSlot'
import { Badge } from '@/components/ui/Badge'
import { GalleryPhotoRecord, GallerySlot } from '@/types/database'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'
import { ImageViewerModal } from '@/components/common/ImageViewerModal'
import { getStoredLikedIds, isPhotoLikedLocally } from '@/lib/gallery/likeHelper'
import {
  Heart,
  MapPin,
  Images,
  Loader2,
} from 'lucide-react'

type FilterOption = 'all' | GallerySlot

export default function GalleryPage() {
  const [mounted, setMounted] = useState(false)
  const [photos, setPhotos] = useState<GalleryPhotoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [likesMap, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>({})

  // Fetch all published photos from Cloudinary gallery controller
  const loadGallery = async () => {
    try {
      const res = await fetch('/api/galleries?mode=all_published')
      if (res.ok) {
        const data = await res.json()
        if (data.items) {
          setPhotos(data.items)
          const stored = getStoredLikedIds()
          const initialLikes: Record<string, { liked: boolean; count: number }> = {}
          data.items.forEach((p: GalleryPhotoRecord) => {
            initialLikes[p.id] = {
              liked: stored.has(p.id),
              count: Number(p.like_count) || 0,
            }
          })
          setLikesMap(initialLikes)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn('Error fetching gallery photos:', err)
    }
    setPhotos([])
    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
    loadGallery()
  }, [])

  // Listen for global like updates
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

  const filteredPhotos =
    activeFilter === 'all'
      ? photos
      : photos.filter((p) => p.gallery_slot === activeFilter)

  const modalPhotos = filteredPhotos.map((p) => ({
    id: p.id,
    src: p.image_url,
    title: p.title || '',
    caption: p.description || p.title || '',
    location: p.location || '',
    alt: p.seo_alt || p.title || 'Himalayan photograph',
    like_count: Number(p.like_count) || 0,
    slot: p.gallery_slot,
  }))

  return (
    <div className="space-y-8 sm:space-y-12">
      <AdSlot slug="category-top" />

      {/* Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="red">
            <Images className="w-3 h-3 mr-1" />
            Visual Collection
          </Badge>
          <span className="text-xs text-ink-tertiary font-mono">
            {filteredPhotos.length} Photographs
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight">
          Himalayan Gallery
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl leading-relaxed">
          High-resolution visual field notes from mountain passes, monastery courtyards, and tranquil sanctuaries across Nepal.
        </p>

        {/* 5 Gallery Filter Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('all')
              setActivePhotoIndex(null)
            }}
            className={`
              px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]
              ${
                activeFilter === 'all'
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
              }
            `}
          >
            All Photographs ({photos.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('hero')
              setActivePhotoIndex(null)
            }}
            className={`
              px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]
              ${
                activeFilter === 'hero'
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
              }
            `}
          >
            🌟 Hero Slides
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('home_grid')
              setActivePhotoIndex(null)
            }}
            className={`
              px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]
              ${
                activeFilter === 'home_grid'
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
              }
            `}
          >
            📸 Homepage Grid
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('prepare_polaroid')
              setActivePhotoIndex(null)
            }}
            className={`
              px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]
              ${
                activeFilter === 'prepare_polaroid'
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
              }
            `}
          >
            🏔️ Preparation
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('trekking_polaroid')
              setActivePhotoIndex(null)
            }}
            className={`
              px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]
              ${
                activeFilter === 'trekking_polaroid'
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
              }
            `}
          >
            🧗 Trekking
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('recovery_polaroid')
              setActivePhotoIndex(null)
            }}
            className={`
              px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]
              ${
                activeFilter === 'recovery_polaroid'
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
              }
            `}
          >
            🌿 Recovery
          </button>
        </div>
      </header>

      {/* Responsive Photo Grid Gallery */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-ink-tertiary">
          <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
          <p className="text-xs">Loading photography collection from Cloudinary...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-hairline-strong rounded-2xl bg-bg-elevated space-y-3">
          <Images className="w-10 h-10 mx-auto text-ink-tertiary" />
          <h3 className="font-display font-bold text-lg text-ink">No Photographs in this Gallery</h3>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            Photographs uploaded via the Staff Gallery Controller will automatically render here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4.5 w-full">
          {filteredPhotos.map((photo, index) => {
            const currentLike =
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
                title="Click to view full photo"
              >
                <ProgressiveImage
                  src={photo.image_url}
                  alt={photo.seo_alt || photo.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-104"
                  loading="lazy"
                />

                {/* Persistent Like Pill on Tile */}
                {currentLike.count > 0 && (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-pill text-[11px] font-bold bg-black/65 text-white backdrop-blur-xs z-10 flex items-center gap-1">
                    <Heart className={`w-3 h-3 ${currentLike.liked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                    <span>{currentLike.count}</span>
                  </div>
                )}

                {/* Overlay: Natural gradient */}
                <div
                  className="
                    absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4.5
                    bg-gradient-to-t from-black/80 via-black/20 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    pointer-events-none z-10
                  "
                >
                  {photo.title && (
                    <p className="text-white text-xs sm:text-sm font-semibold mb-1 leading-snug truncate drop-shadow-sm">
                      {photo.title}
                    </p>
                  )}
                  {photo.location && (
                    <div className="flex items-center gap-1.5 text-white/90 text-[11px] sm:text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-accent-red" />
                      <span className="truncate">{photo.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FULL-VIEW LIGHTBOX MODAL (ZERO CROP ACROSS ALL ASPECT RATIOS) */}
      <ImageViewerModal
        photos={modalPhotos}
        initialIndex={activePhotoIndex ?? 0}
        isOpen={activePhotoIndex !== null}
        onClose={() => setActivePhotoIndex(null)}
      />
    </div>
  )
}
