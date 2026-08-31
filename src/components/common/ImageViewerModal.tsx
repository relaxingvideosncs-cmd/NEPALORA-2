'use client'

import React, { useEffect, useCallback, useState, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Check,
  Send,
  Mountain,
} from 'lucide-react'
import { getWebImageUrl } from '@/lib/cloudinary/imageHelper'
import {
  getStoredLikedIds,
  isPhotoLikedLocally,
  togglePhotoLike,
} from '@/lib/gallery/likeHelper'

const HEART_PATH =
  'M12 20.5c-.3 0-.6-.1-.8-.3C7.8 17.3 3 13.2 3 8.9 3 5.9 5.3 3.5 8.3 3.5c1.7 0 3.2.8 4.2 2.1.9-1.3 2.5-2.1 4.2-2.1 3 0 5.3 2.4 5.3 5.4 0 4.3-4.8 8.4-8.2 11.3-.2.2-.5.3-.8.3z'

type Particle = { id: number; dx: number; dy: number }

export interface ImageViewerPhoto {
  id: string
  src: string
  title?: string
  caption?: string
  location?: string
  alt?: string
  like_count?: number
  slot?: string
}

interface ImageViewerModalProps {
  photos: ImageViewerPhoto[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  isHandwrittenCaption?: boolean
}

export function ImageViewerModal({
  photos,
  initialIndex,
  isOpen,
  onClose,
  isHandwrittenCaption = false,
}: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [copiedShare, setCopiedShare] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [likesMap, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>({})

  // Instagram particle & big heart states
  const [particles, setParticles] = useState<Particle[]>([])
  const [bigHeartKey, setBigHeartKey] = useState<number | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const lastTap = useRef(0)
  const particleId = useRef(0)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Initialize from database photo records and localStorage
  useEffect(() => {
    const stored = getStoredLikedIds()
    const nextMap: Record<string, { liked: boolean; count: number }> = {}
    photos.forEach((p) => {
      nextMap[p.id] = {
        liked: stored.has(p.id),
        count: Number(p.like_count) || 0,
      }
    })
    setLikesMap(nextMap)
  }, [photos])

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

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % photos.length)
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, photos.length, onClose])

  const currentPhoto = photos[currentIndex] || photos[0]
  const currentLike = currentPhoto
    ? likesMap[currentPhoto.id] || {
        liked: isPhotoLikedLocally(currentPhoto.id),
        count: Number(currentPhoto.like_count) || 0,
      }
    : { liked: false, count: 0 }

  // Spawns 8 radial burst particles around the heart button
  const spawnParticles = () => {
    const next: Particle[] = Array.from({ length: 8 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 8
      const dist = 18 + Math.random() * 6
      particleId.current += 1
      return {
        id: particleId.current,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
      }
    })
    setParticles(next)
    setTimeout(() => setParticles([]), 500)
  }

  // Plays big overlay heart + radial button particles + pulse
  const playLikeAnimation = () => {
    const now = Date.now()
    setBigHeartKey(now)
    setTimeout(() => setBigHeartKey((k) => (k === now ? null : k)), 750)

    setPulseKey((k) => k + 1)
    spawnParticles()
  }

  // Button Like/Unlike Toggle
  const handleLikeToggle = useCallback(
    async (photoId: string, e?: React.MouseEvent) => {
      e?.stopPropagation()
      const currentState = likesMap[photoId] || {
        liked: isPhotoLikedLocally(photoId),
        count: Number(currentPhoto?.like_count) || 0,
      }

      if (!currentState.liked) {
        playLikeAnimation()
      }

      const updated = await togglePhotoLike(photoId, currentState.count)
      setLikesMap((prev) => ({
        ...prev,
        [photoId]: updated,
      }))
    },
    [likesMap, currentPhoto]
  )

  // Double-tap on photo (matches Instagram: triggers full like animation & sets liked)
  const handlePhotoClick = useCallback(
    async (photoId: string) => {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        setShowHint(false)
        const currentState = likesMap[photoId] || {
          liked: isPhotoLikedLocally(photoId),
          count: Number(currentPhoto?.like_count) || 0,
        }

        playLikeAnimation()

        if (!currentState.liked) {
          const updated = await togglePhotoLike(photoId, currentState.count)
          setLikesMap((prev) => ({
            ...prev,
            [photoId]: updated,
          }))
        }

        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    },
    [likesMap, currentPhoto]
  )

  // Share Handler
  const handleShare = useCallback((photo: ImageViewerPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${photo.src}` : photo.src
    if (navigator.share) {
      navigator
        .share({
          title: photo.title || 'Soul of Nepal Photograph',
          text: photo.caption || photo.title,
          url: shareUrl,
        })
        .then(() => {
          setCopiedShare(true)
          setTimeout(() => setCopiedShare(false), 2200)
        })
        .catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2200)
    }
  }, [])

  if (!isOpen || !photos || photos.length === 0) return null

  const webSrc = getWebImageUrl(currentPhoto.src)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentPhoto.title || 'Instagram style photograph viewer'}
      onClick={onClose}
      className="
        fixed inset-0 z-[99999] flex items-center justify-center
        bg-black/90 backdrop-blur-md p-2 sm:p-4 md:p-6 lg:p-10
        animate-in fade-in-0 duration-150 select-none
      "
    >
      {/* Top Floating Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="
          absolute top-3 right-3 sm:top-5 sm:right-5 z-50
          w-10 h-10 min-h-[40px] min-w-[40px] rounded-full
          bg-black/60 hover:bg-black/85 text-white/90 hover:text-white
          border border-white/20 shadow-xl flex items-center justify-center
          transition-all active:scale-90 cursor-pointer
        "
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Instagram Split-Pane Shell */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-6xl max-h-[92vh] sm:max-h-[88vh]
          bg-[#000000] dark:bg-[#121212] rounded-2xl sm:rounded-3xl
          border border-white/15 shadow-2xl overflow-hidden
          flex flex-col md:flex-row
          animate-in zoom-in-95 duration-150
        "
      >
        {/* ========================================================= */}
        {/* LEFT PANE: PHOTO STAGE (Zero Crop, Any Aspect Ratio)      */}
        {/* ========================================================= */}
        <div
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return
            const diff = touchStartX - e.changedTouches[0].clientX
            if (diff > 45) {
              setCurrentIndex((prev) => (prev + 1) % photos.length)
            } else if (diff < -45) {
              setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
            }
            setTouchStartX(null)
          }}
          onClick={() => handlePhotoClick(currentPhoto.id)}
          className="
            relative flex-1 bg-black flex items-center justify-center
            min-h-[320px] sm:min-h-[460px] md:min-h-[560px] max-h-[58vh] md:max-h-[88vh]
            p-2 sm:p-4 overflow-hidden select-none cursor-pointer
          "
          title="Double-click to like photo"
        >
          {/* Previous Arrow */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
              }}
              aria-label="Previous photo"
              className="
                absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30
                w-9 h-9 sm:w-10 sm:h-10 rounded-full
                bg-black/60 hover:bg-black/85 text-white
                border border-white/25 shadow-xl
                flex items-center justify-center transition-all
                hover:scale-105 active:scale-90 cursor-pointer
              "
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Pure Zero-Crop Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={webSrc}
            src={webSrc}
            alt={currentPhoto.alt || currentPhoto.title || 'Soul of Nepal Photograph'}
            className="
              max-h-[54vh] md:max-h-[84vh] max-w-full w-auto h-auto
              object-contain select-none m-auto block rounded-sm
            "
            draggable={false}
          />

          {/* Big Instagram Floating Heart Overlay */}
          {bigHeartKey && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <svg
                key={bigHeartKey}
                width="96"
                height="96"
                viewBox="0 0 24 24"
                className="ig-big-heart"
              >
                <defs>
                  <linearGradient id="igHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff1f4b" />
                    <stop offset="100%" stopColor="#a300e6" />
                  </linearGradient>
                </defs>
                <path d={HEART_PATH} fill="url(#igHeartGrad)" />
              </svg>
            </div>
          )}

          {/* Double Tap Hint */}
          {showHint && (
            <div className="absolute bottom-3 right-4 text-[10px] text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-pill border border-white/15 pointer-events-none">
              double-tap to like
            </div>
          )}

          {/* Next Arrow */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex((prev) => (prev + 1) % photos.length)
              }}
              aria-label="Next photo"
              className="
                absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30
                w-9 h-9 sm:w-10 sm:h-10 rounded-full
                bg-black/60 hover:bg-black/85 text-white
                border border-white/25 shadow-xl
                flex items-center justify-center transition-all
                hover:scale-105 active:scale-90 cursor-pointer
              "
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: INSTAGRAM SIDEBAR (Header, Caption, Actions)  */}
        {/* ========================================================= */}
        <div
          className="
            w-full md:w-[380px] lg:w-[420px] flex-shrink-0
            bg-[#121212] text-white border-t md:border-t-0 md:border-l border-white/10
            flex flex-col justify-between overflow-hidden
          "
        >
          {/* 1. TOP HEADER (Avatar + Username + Location) */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#181818]/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-accent-red via-accent-gold to-accent-blue flex-shrink-0 shadow-xs">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white">
                  <Mountain className="w-4 h-4 text-accent-gold" />
                </div>
              </div>

              <div className="leading-tight">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <span>soulofnepal</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-accent-blue flex items-center justify-center text-[9px] text-white">
                    ✓
                  </span>
                </div>
                {currentPhoto.location ? (
                  <div className="flex items-center gap-1 text-[11px] text-white/70">
                    <MapPin className="w-3 h-3 text-accent-red flex-shrink-0" />
                    <span className="truncate">{currentPhoto.location}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-white/50">Nepal Himalayas</span>
                )}
              </div>
            </div>

            <span className="text-[11px] font-mono text-white/60 px-2 py-0.5 rounded-md bg-white/10">
              {currentIndex + 1}/{photos.length}
            </span>
          </div>

          {/* 2. MIDDLE CONTENT (Scrollable Post Caption) */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5 max-h-[30vh] md:max-h-[calc(88vh-180px)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mountain className="w-3.5 h-3.5 text-accent-blue" />
              </div>

              <div className="space-y-1.5 flex-1 text-xs text-white/90 leading-relaxed">
                <p>
                  <span className="font-bold text-white mr-1.5">soulofnepal</span>
                  {currentPhoto.title && (
                    <span className="font-semibold text-accent-gold mr-1.5">
                      {currentPhoto.title} —
                    </span>
                  )}
                  <span
                    className={isHandwrittenCaption ? 'text-sm font-bold block mt-1' : ''}
                    style={
                      isHandwrittenCaption
                        ? { fontFamily: "var(--font-handwriting), 'Caveat', cursive", fontSize: '20px' }
                        : undefined
                    }
                  >
                    {currentPhoto.caption || currentPhoto.title || 'Himalayan visual field note.'}
                  </span>
                </p>

                {currentPhoto.slot && (
                  <div className="pt-2 flex items-center gap-2 text-[10px] text-white/50 uppercase font-mono tracking-wider">
                    <span>Collection: {currentPhoto.slot.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. BOTTOM PINNED INSTAGRAM ACTION BAR (Burst Particles + Like + Share) */}
          <div className="p-4 border-t border-white/10 bg-[#181818]/60 space-y-2.5">
            <div className="flex items-center gap-4">
              {/* Instagram Like Button with Radial Particle Burst */}
              <button
                type="button"
                onClick={(e) => handleLikeToggle(currentPhoto.id, e)}
                aria-label={currentLike.liked ? 'Unlike' : 'Like'}
                aria-pressed={currentLike.liked}
                className="relative w-7 h-7 flex items-center justify-center cursor-pointer p-0 bg-transparent border-0 select-none"
                title={currentLike.liked ? 'Unlike' : 'Like'}
              >
                {/* Outline Heart (visible when unliked) */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ed4956"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute transition-opacity duration-150"
                  style={{ opacity: currentLike.liked ? 0 : 1 }}
                >
                  <path d={HEART_PATH} />
                </svg>

                {/* Filled Heart (pops in when liked) */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  key={pulseKey}
                  className="absolute"
                  style={{
                    transform: currentLike.liked ? 'scale(1)' : 'scale(0)',
                    opacity: currentLike.liked ? 1 : 0,
                    animation: currentLike.liked
                      ? 'igBtnHeartPop 320ms cubic-bezier(.17,.89,.32,1.49)'
                      : 'none',
                  }}
                >
                  <path d={HEART_PATH} fill="#ed4956" />
                </svg>

                {/* Burst Particles */}
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="ig-particle"
                    style={
                      {
                        '--dx': `${p.dx}px`,
                        '--dy': `${p.dy}px`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </button>

              {/* Share / Send Plane */}
              <button
                type="button"
                onClick={(e) => handleShare(currentPhoto, e)}
                aria-label="Share photo"
                className="flex items-center gap-1.5 transition-transform active:scale-110 cursor-pointer text-white hover:text-white/80"
                title="Share photo link"
              >
                {copiedShare ? (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                    <Check className="w-5 h-5" />
                    <span>Link Copied</span>
                  </div>
                ) : (
                  <Send className="w-5 h-5 rotate-[15deg] transition-transform hover:translate-x-0.5 hover:-translate-y-0.5" />
                )}
              </button>
            </div>

            {/* Like Counter in Bold */}
            <div className="space-y-0.5">
              <p className="font-bold text-xs text-white">
                {currentLike.count.toLocaleString()}{' '}
                {currentLike.count === 1 ? 'like' : 'likes'}
              </p>
              <p className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                Field Guide • Soul of Nepal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
