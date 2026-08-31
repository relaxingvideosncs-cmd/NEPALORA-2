'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { GalleryPhotoRecord } from '@/types/database'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'
import { ImageViewerModal } from '@/components/common/ImageViewerModal'
import { getStoredLikedIds, isPhotoLikedLocally } from '@/lib/gallery/likeHelper'
import { Images } from 'lucide-react'

interface GalleryBrowserProps {
  initialPhotos: GalleryPhotoRecord[]
}

export function GalleryBrowser({ initialPhotos = [] }: GalleryBrowserProps) {
  const [, setMounted] = useState(false)
  const [photos] = useState<GalleryPhotoRecord[]>(initialPhotos)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [categoriesList, setCategoriesList] = useState<string[]>([])
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>(() => {
    const initialLikes: Record<string, { liked: boolean; count: number }> = {}
    initialPhotos.forEach((p: GalleryPhotoRecord) => {
      initialLikes[p.id] = {
        liked: false,
        count: Number(p.like_count) || 0,
      }
    })
    return initialLikes
  })

  // Hydrate local like state and fetch categories
  useEffect(() => {
    setMounted(true)
    const stored = getStoredLikedIds()
    setLikesMap((prev) => {
      const next = { ...prev }
      photos.forEach((p) => {
        next[p.id] = {
          liked: stored.has(p.id),
          count: Number(p.like_count) || 0,
        }
      })
      return next
    })

    // Fetch dynamic categories
    fetch('/api/gallery-categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && Array.isArray(data.categories)) {
          const names = data.categories
            .filter((c: any) => c.is_active)
            .map((c: any) => c.name)
          setCategoriesList(names)
        }
      })
      .catch(() => {})
  }, [photos])

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: photos.length }
    photos.forEach((p) => {
      const cat = p.category || 'Mountains & Landscapes'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [photos])

  // Ensure all categories that have photos are represented
  const displayCategories = useMemo(() => {
    const set = new Set(categoriesList)
    Object.keys(categoryCounts).forEach((c) => {
      if (c !== 'all') set.add(c)
    })
    return ['all', ...Array.from(set)]
  }, [categoriesList, categoryCounts])

  // Listen for global like updates across components
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

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return photos
    return photos.filter((p) => (p.category || 'Mountains & Landscapes') === activeCategory)
  }, [photos, activeCategory])

  const modalPhotos = useMemo(() => {
    return filteredPhotos.map((p) => ({
      id: p.id,
      src: p.image_url,
      title: p.title || '',
      caption: p.description || p.title || '',
      location: p.location || '',
      alt: p.seo_alt || p.title || 'Himalayan photograph',
      like_count: Number(p.like_count) || 0,
      slot: p.gallery_slot,
      category: p.category || 'Mountains & Landscapes',
    }))
  }, [filteredPhotos])

  return (
    <>
      {/* Category Filter Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {displayCategories.map((cat) => {
          const isSelected = activeCategory === cat
          const count = categoryCounts[cat] || 0

          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat)
                setActivePhotoIndex(null)
              }}
              className={`
                px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px] flex items-center gap-2 border
                ${
                  isSelected
                    ? 'bg-neutral-950 !text-white dark:bg-white dark:!text-neutral-950 border-transparent shadow-xs font-bold'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border-hairline dark:border-white/10 hover:border-hairline-strong'
                }
              `}
            >
              <span className={isSelected ? '!text-white dark:!text-neutral-950 font-bold' : 'text-inherit'}>
                {cat === 'all' ? 'All Photographs' : cat}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-pill font-mono ${
                  isSelected
                    ? 'bg-white/20 dark:bg-black/20 !text-white dark:!text-neutral-950 font-bold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pure Photo Grid (Matching Exact Reference Layout & Hover Transitions) */}
      {filteredPhotos.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-hairline-strong rounded-[10px] bg-bg-elevated space-y-3">
          <Images className="w-10 h-10 mx-auto text-ink-tertiary" />
          <h3 className="font-display font-bold text-lg text-ink">No Photographs in this Category</h3>
          <p className="text-xs sm:text-sm text-ink-secondary max-w-sm mx-auto">
            Choose another category above to explore other photographs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px] pt-4 w-full">
          {filteredPhotos.map((photo, index) => {
            const descText = photo.description || photo.title
            const locationText = photo.location || 'Nepal'
            return (
              <div
                key={photo.id}
                onClick={() => setActivePhotoIndex(index)}
                className="group relative aspect-square rounded-[10px] overflow-hidden cursor-pointer bg-[#ddd] dark:bg-[#222] select-none"
              >
                {/* Full Bleed Image with 0.6s cubic-bezier zoom */}
                <ProgressiveImage
                  src={photo.image_url}
                  alt={photo.seo_alt || photo.title || 'Himalayan photograph'}
                  profile="card"
                  className="w-full h-full object-cover block transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                />

                {/* Overlay: Hidden by default, fades + slides up on hover */}
                <div
                  className="
                    absolute inset-0 flex flex-col justify-end p-4
                    opacity-0 group-hover:opacity-100 transition-opacity duration-350
                    pointer-events-none
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

                  <div className="flex items-center gap-[5px] text-white/85 text-[12px] translate-y-[6px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-350 delay-[100ms]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[12px] h-[12px] flex-shrink-0 text-white/85">
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 12 8 12s8-6.6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
                    </svg>
                    <span className="truncate">{locationText}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox / Master Resolution Fullscreen Viewer */}
      {activePhotoIndex !== null && (
        <ImageViewerModal
          isOpen={true}
          onClose={() => setActivePhotoIndex(null)}
          photos={modalPhotos}
          initialIndex={activePhotoIndex}
        />
      )}
    </>
  )
}
