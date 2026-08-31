'use client'

import React, { useRef, useEffect, useState } from 'react'
import { NepalPhoto } from '@/lib/data/nepalImages'
import { GalleryPhotoRecord } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'
import { ImageViewerModal } from '@/components/common/ImageViewerModal'
import { getStoredLikedIds, isPhotoLikedLocally } from '@/lib/gallery/likeHelper'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react'

interface PolaroidGalleryProps {
  title?: string
  subtitle?: string
  badgeText?: string
  badgeTone?: 'neutral' | 'red' | 'blue'
  photos: (NepalPhoto | GalleryPhotoRecord | any)[]
  className?: string
}

export function PolaroidGallery({
  title = 'Glimpses of Nepal',
  subtitle = 'Fleeting moments, trail memories, and sacred spaces captured across the Himalayas.',
  badgeText = 'Glimpses',
  badgeTone = 'red',
  photos = [],
  className = '',
}: PolaroidGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  const normalizedPhotos = (photos || []).map((p, idx) => ({
    id: p.id || `polaroid-${idx}`,
    src: p.image_url || p.src,
    title: p.title || '',
    caption: p.description || p.caption || p.title || '',
    location: p.location || '',
    alt: p.seo_alt || p.alt_text || p.alt || p.title || 'Polaroid photo of Nepal',
    like_count: Number(p.like_count) || 0,
    slot: 'polaroid',
  }))

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [likesMap, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>({})

  // Synchronize with database props and localStorage
  useEffect(() => {
    const stored = getStoredLikedIds()
    const initial: Record<string, { liked: boolean; count: number }> = {}
    normalizedPhotos.forEach((p) => {
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

  const repeatedPhotos =
    normalizedPhotos.length > 0
      ? [
          ...normalizedPhotos,
          ...normalizedPhotos,
          ...normalizedPhotos,
          ...normalizedPhotos,
          ...normalizedPhotos,
          ...normalizedPhotos,
        ]
      : []

  useEffect(() => {
    setMounted(true)
    const track = trackRef.current
    if (!track || normalizedPhotos.length === 0) return

    let cardStep = 0
    let setWidth = 0
    let position = 0
    const speed = 0.5
    let isTouching = false
    let isHovered = false
    let rafId: number | null = null

    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0
    let touchStartPosition = 0
    let isSwipingHorizontal: boolean | null = null

    const trackEl: HTMLDivElement = track

    function measure() {
      if (!trackEl) return
      const card = trackEl.querySelector<HTMLElement>('.polaroid-item')
      if (!card) return
      const style = window.getComputedStyle(card)
      cardStep = card.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight)
      setWidth = cardStep * normalizedPhotos.length
      if (position === 0) {
        position = setWidth * 2
      }
      trackEl.style.transition = 'none'
      trackEl.style.transform = `translate3d(${-position}px, 0, 0)`
    }

    function wrapPosition() {
      if (setWidth <= 0) return
      while (position >= setWidth * 3) position -= setWidth
      while (position < setWidth * 2) position += setWidth
    }

    function tick() {
      if (!isTouching && !isHovered && setWidth > 0 && trackEl && activePhotoIndex === null) {
        position += speed
        if (position >= setWidth * 3) {
          position -= setWidth
        } else if (position < setWidth * 2) {
          position += setWidth
        }
        trackEl.style.transform = `translate3d(${-position}px, 0, 0)`
      }
      rafId = requestAnimationFrame(tick)
    }

    function goTo(delta: number) {
      if (!trackEl || setWidth === 0) return
      position += delta
      trackEl.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      trackEl.style.transform = `translate3d(${-position}px, 0, 0)`

      const handleTransitionEnd = () => {
        trackEl.removeEventListener('transitionend', handleTransitionEnd)
        trackEl.style.transition = 'none'
        wrapPosition()
        trackEl.style.transform = `translate3d(${-position}px, 0, 0)`
      }

      trackEl.addEventListener('transitionend', handleTransitionEnd)
    }

    const nextBtn = document.getElementById(`polaroid-next-${title.replace(/\s+/g, '-').toLowerCase()}`)
    const prevBtn = document.getElementById(`polaroid-prev-${title.replace(/\s+/g, '-').toLowerCase()}`)

    const handleNext = () => goTo(cardStep)
    const handlePrev = () => goTo(-cardStep)

    nextBtn?.addEventListener('click', handleNext)
    prevBtn?.addEventListener('click', handlePrev)

    const galleryEl = trackEl.parentElement?.parentElement

    const handleTouchStart = (e: TouchEvent) => {
      if (setWidth === 0) return
      isTouching = true
      isDraggingRef.current = false
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      touchStartTime = Date.now()
      touchStartPosition = position
      isSwipingHorizontal = null
      trackEl.style.transition = 'none'
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || setWidth === 0) return
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = touchStartX - currentX
      const deltaY = touchStartY - currentY

      if (isSwipingHorizontal === null) {
        if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
          isSwipingHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        }
      }

      if (isSwipingHorizontal) {
        if (e.cancelable) e.preventDefault()
        if (Math.abs(deltaX) > 8) {
          isDraggingRef.current = true
        }
        position = touchStartPosition + deltaX
        wrapPosition()
        trackEl.style.transform = `translate3d(${-position}px, 0, 0)`
      }
    }

    const handleTouchEnd = () => {
      if (!isTouching) return
      isTouching = false
      wrapPosition()
      trackEl.style.transition = 'none'
      trackEl.style.transform = `translate3d(${-position}px, 0, 0)`

      setTimeout(() => {
        isDraggingRef.current = false
      }, 50)
    }

    const handleMouseEnter = () => {
      isHovered = true
    }

    const handleMouseLeave = () => {
      isHovered = false
    }

    galleryEl?.addEventListener('mouseenter', handleMouseEnter)
    galleryEl?.addEventListener('mouseleave', handleMouseLeave)
    galleryEl?.addEventListener('touchstart', handleTouchStart, { passive: true })
    galleryEl?.addEventListener('touchmove', handleTouchMove, { passive: false })
    galleryEl?.addEventListener('touchend', handleTouchEnd)
    galleryEl?.addEventListener('touchcancel', handleTouchEnd)

    measure()
    rafId = requestAnimationFrame(tick)

    const handleResize = () => {
      measure()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      nextBtn?.removeEventListener('click', handleNext)
      prevBtn?.removeEventListener('click', handlePrev)
      galleryEl?.removeEventListener('mouseenter', handleMouseEnter)
      galleryEl?.removeEventListener('mouseleave', handleMouseLeave)
      galleryEl?.removeEventListener('touchstart', handleTouchStart)
      galleryEl?.removeEventListener('touchmove', handleTouchMove)
      galleryEl?.removeEventListener('touchend', handleTouchEnd)
      galleryEl?.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [normalizedPhotos, title, activePhotoIndex])

  if (!normalizedPhotos || normalizedPhotos.length === 0) return null

  const uniqueId = title.replace(/\s+/g, '-').toLowerCase()

  return (
    <section className={`space-y-4 py-3 sm:py-6 ${className}`}>
      {/* Header with Top < > Slider Buttons */}
      <div className="flex items-end justify-between gap-4 border-b border-hairline pb-3.5">
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id={`polaroid-prev-${uniqueId}`}
            type="button"
            aria-label="Previous photograph"
            className="
              w-10 h-10 min-h-[44px] min-w-[44px] rounded-full
              border border-hairline bg-bg-elevated hover:bg-bg
              text-ink flex items-center justify-center shadow-xs
              hover:border-hairline-strong transition-all active:scale-90 cursor-pointer
            "
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            id={`polaroid-next-${uniqueId}`}
            type="button"
            aria-label="Next photograph"
            className="
              w-10 h-10 min-h-[44px] min-w-[44px] rounded-full
              border border-hairline bg-bg-elevated hover:bg-bg
              text-ink flex items-center justify-center shadow-xs
              hover:border-hairline-strong transition-all active:scale-90 cursor-pointer
            "
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Polaroid Slide Gallery Stage */}
      <div className="relative w-full overflow-hidden py-6 sm:py-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          className="overflow-hidden w-full select-none py-4 -my-4 touch-pan-y"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
          }}
        >
          <div
            ref={trackRef}
            className="flex will-change-transform py-3 cursor-grab active:cursor-grabbing"
            style={{ width: 'max-content' }}
          >
            {repeatedPhotos.map((photo, index) => {
              const originalIndex = index % normalizedPhotos.length
              const captionText = photo.caption || photo.title
              const photoLike =
                mounted && likesMap[photo.id]
                  ? likesMap[photo.id]
                  : { liked: false, count: Number(photo.like_count) || 0 }

              return (
                <div
                  key={`${photo.id}-${index}`}
                  onClick={() => {
                    if (!isDraggingRef.current) {
                      setActivePhotoIndex(originalIndex)
                    }
                  }}
                  className="
                    polaroid-item flex-shrink-0 w-[270px] sm:w-[300px] mx-3.5 sm:mx-4
                    bg-[#ffffff] text-[#1a1a1a]
                    border border-black/5
                    rounded-[6px] p-4 pb-0
                    shadow-[0_14px_35px_rgba(0,0,0,0.11),0_3px_8px_rgba(0,0,0,0.06)]
                    hover:-translate-y-2.5 hover:shadow-[0_22px_48px_rgba(0,0,0,0.18),0_6px_14px_rgba(0,0,0,0.10)]
                    transition-all duration-350 cursor-pointer group relative select-none
                  "
                  title="Click to view full photo"
                >
                  <div className="w-full aspect-square rounded-[3px] overflow-hidden bg-[#f0f0f0] relative pointer-events-none">
                    <ProgressiveImage
                      src={photo.src}
                      alt={photo.alt}
                      profile="thumb"
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover block group-hover:scale-103 transition-transform duration-500"
                      loading="lazy"
                      draggable="false"
                    />

                    {photoLike.count > 0 && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs z-10 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        <span>{photoLike.count}</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <span className="px-2.5 py-1 rounded-pill text-[10px] font-bold bg-black/75 backdrop-blur-xs text-white shadow-md">
                        Enlarge ⤢
                      </span>
                    </div>
                  </div>

                  <div className="h-[84px] flex items-center justify-center text-center px-2 pt-1.5 pb-2 pointer-events-none">
                    <span
                      className="text-[#1a1a1a] font-bold leading-snug line-clamp-2"
                      style={{
                        fontFamily: "var(--font-handwriting), 'Caveat', cursive",
                        fontSize: '23px',
                        color: '#1a1a1a',
                      }}
                    >
                      {captionText}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FULL-VIEW LIGHTBOX MODAL (ZERO CROP ACROSS ALL ASPECT RATIOS) */}
      <ImageViewerModal
        photos={normalizedPhotos}
        initialIndex={activePhotoIndex ?? 0}
        isOpen={activePhotoIndex !== null}
        onClose={() => setActivePhotoIndex(null)}
        isHandwrittenCaption={true}
      />
    </section>
  )
}
