'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { InstantSearchBar } from '@/components/search/InstantSearchBar'
import { ChevronLeft, ChevronRight, MapPin, Heart } from 'lucide-react'
import { GalleryPhotoRecord } from '@/types/database'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'
import { getStoredLikedIds, isPhotoLikedLocally, togglePhotoLike } from '@/lib/gallery/likeHelper'

interface HeroSlideshowProps {
  slides?: GalleryPhotoRecord[] | any[]
}

export function HeroSlideshow({ slides = [] }: HeroSlideshowProps) {
  const activeSlides =
    slides && slides.length > 0
      ? slides.map((s, idx) => ({
          id: s.id || `hero-${idx}`,
          src: s.image_url || s.src,
          title: (s.title && s.title !== 'null' && s.title !== 'undefined') ? String(s.title).trim() : '',
          location: (s.location && s.location !== 'null' && s.location !== 'undefined') ? String(s.location).trim() : '',
          alt: s.seo_alt || s.alt_text || s.title || 'Nepalora',
          like_count: s.like_count || 0,
        }))
      : []

  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likesMap, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>({})
  const touchStartXRef = useRef<number | null>(null)

  // Initialize after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true)
    const stored = getStoredLikedIds()
    const initial: Record<string, { liked: boolean; count: number }> = {}
    activeSlides.forEach((s) => {
      initial[s.id] = {
        liked: stored.has(s.id),
        count: Number(s.like_count) || 0,
      }
    })
    setLikesMap(initial)
  }, [slides])

  // Synchronize across components
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

  useEffect(() => {
    if (activeSlides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [activeSlides.length])

  const nextSlide = () => {
    if (activeSlides.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length)
  }

  const prevSlide = () => {
    if (activeSlides.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX
    if (diff > 50) {
      nextSlide()
    } else if (diff < -50) {
      prevSlide()
    }
    touchStartXRef.current = null
  }

  const currentPhoto = activeSlides[currentIndex] || activeSlides[0]
  const currentLike =
    currentPhoto && mounted
      ? likesMap[currentPhoto.id] || {
          liked: isPhotoLikedLocally(currentPhoto.id),
          count: Number(currentPhoto.like_count) || 0,
        }
      : { liked: false, count: Number(currentPhoto?.like_count) || 0 }

  const handleHeroLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!currentPhoto?.id) return
      const updated = await togglePhotoLike(currentPhoto.id, currentLike.count)
      setLikesMap((prev) => ({
        ...prev,
        [currentPhoto.id]: updated,
      }))
    },
    [currentPhoto, currentLike]
  )

  const hasValidLocationInfo = Boolean(
    (currentPhoto?.title && currentPhoto.title !== 'null' && currentPhoto.title !== '') ||
    (currentPhoto?.location && currentPhoto.location !== 'null' && currentPhoto.location !== '')
  )

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="
        relative w-full overflow-hidden
        h-[88vh] sm:h-[92vh] md:h-[95vh] min-h-[580px] max-h-[960px]
        flex flex-col justify-between
        shadow-2xl select-none bg-neutral-950
      "
    >
      {/* 1. Full-Screen Pure Natural Background */}
      <div className="absolute inset-0 z-0 bg-neutral-950">
        {activeSlides.length > 0 ? (
          activeSlides.map((img, idx) => (
            <div
              key={img.src + idx}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{
                opacity: idx === currentIndex ? 1 : 0,
                zIndex: idx === currentIndex ? 1 : 0,
              }}
            >
              <ProgressiveImage
                src={img.src}
                alt={img.alt}
                profile="hero"
                containerClassName="w-full h-full"
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={idx === 0 ? 'high' : undefined}
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-neutral-950" />
        )}
      </div>

      {/* 2. Top Bar (Clean floating pills) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 flex items-center justify-between gap-3">
        {/* Like & Unlike Badge */}
        {currentPhoto && (
          <button
            type="button"
            onClick={handleHeroLike}
            aria-label={currentLike.liked ? 'Unlike hero photograph' : 'Like hero photograph'}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill backdrop-blur-md text-xs font-semibold
              border transition-all cursor-pointer select-none active:scale-95 shadow-md
              ${
                currentLike.liked
                  ? 'bg-rose-500/80 border-rose-400 text-white'
                  : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
              }
            `}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                currentLike.liked ? 'fill-white text-white scale-110' : 'text-rose-400'
              }`}
            />
            <span>{currentLike.count}</span>
          </button>
        )}

        {/* Location Tag (Rendered only if genuine valid title or location exists) */}
        {currentPhoto && hasValidLocationInfo && (
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white px-3.5 py-1.5 rounded-pill border border-white/20 text-[11px] sm:text-xs shadow-md">
            <MapPin className="w-3.5 h-3.5 text-accent-red flex-shrink-0" />
            {currentPhoto.title && <span className="font-semibold">{currentPhoto.title}</span>}
            {currentPhoto.location && (
              <>
                {currentPhoto.title && <span className="text-white/50 hidden sm:inline">•</span>}
                <span className="text-white/80 hidden sm:inline">{currentPhoto.location}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Hero Content & Search (Brought slightly up for optical balance & alignment) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 my-auto pb-14 sm:pb-20 md:pb-24 flex flex-col items-center text-center space-y-4 sm:space-y-6">
        <div className="space-y-2.5 max-w-3xl">
          <h1
            className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.95)' }}
          >
            Discover the Soul of Nepal
          </h1>
          <p
            className="text-xs sm:text-base md:text-lg text-white/95 leading-relaxed max-w-xl mx-auto font-medium"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.9)' }}
          >
            Structured field guides for Himalayan trekking routes, visa checklists, and post-trek recovery.
          </p>
        </div>

        <div className="w-full max-w-xl bg-black/40 backdrop-blur-lg rounded-2xl sm:rounded-pill p-1.5 sm:p-2.5 border border-white/30 shadow-2xl">
          <InstantSearchBar />
        </div>

        {activeSlides.length > 1 && (
          <div className="flex items-center justify-between w-full max-w-xl pt-2">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous background photo"
              className="
                w-10 h-10 min-h-[44px] min-w-[44px] rounded-full
                bg-black/50 hover:bg-black/80 backdrop-blur-md
                text-white border border-white/20 shadow-md
                flex items-center justify-center transition-all
                hover:scale-105 active:scale-90 cursor-pointer
              "
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-black/50 backdrop-blur-md border border-white/20">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`
                    transition-all duration-300 rounded-full cursor-pointer
                    ${
                      idx === currentIndex
                        ? 'w-6 h-2 bg-white shadow-xs'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/75'
                    }
                  `}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next background photo"
              className="
                w-10 h-10 min-h-[44px] min-w-[44px] rounded-full
                bg-black/50 hover:bg-black/80 backdrop-blur-md
                text-white border border-white/20 shadow-md
                flex items-center justify-center transition-all
                hover:scale-105 active:scale-90 cursor-pointer
              "
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
