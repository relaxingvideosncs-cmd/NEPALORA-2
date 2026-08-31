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

const TRANSITION_MS = 380

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
  category?: string
}

interface ImageViewerModalProps {
  photos: ImageViewerPhoto[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  isHandwrittenCaption?: boolean
}

/**
 * Crisp image renderer with instant display & high-resolution delivery.
 * Avoids heavy artificial blurs so images remain sharp and crystal clear.
 */
function StageImage({ photo }: { photo: ImageViewerPhoto }) {
  const fullSrc = getWebImageUrl(photo.src, 'full')
  const [imageError, setImageError] = useState(false)

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1 sm:p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageError ? photo.src : fullSrc}
        alt={photo.alt || photo.title || 'Nepalora Photograph'}
        draggable={false}
        onError={() => setImageError(true)}
        className="max-h-full max-w-full w-auto h-auto object-contain select-none rounded-lg drop-shadow-2xl transition-transform duration-300"
      />
    </div>
  )
}

export function ImageViewerModal({
  photos,
  initialIndex,
  isOpen,
  onClose,
  isHandwrittenCaption = false,
}: ImageViewerModalProps) {
  const [current, setCurrent] = useState(() => ({
    photo: photos[initialIndex] || photos[0],
    index: initialIndex,
  }))
  const [incoming, setIncoming] = useState<{
    photo: ImageViewerPhoto
    index: number
    dir: 1 | -1
  } | null>(null)
  const [animate, setAnimate] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const isAnimatingRef = useRef(false)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  const [copiedShare, setCopiedShare] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [likesMap, setLikesMap] = useState<Record<string, { liked: boolean; count: number }>>({})

  // Instagram particle & floating heart states
  const [particles, setParticles] = useState<Particle[]>([])
  const [bigHeartKey, setBigHeartKey] = useState<number | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const lastTap = useRef(0)
  const particleId = useRef(0)

  const preloadedRef = useRef<Set<string>>(new Set())
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
  }, [])

  const effectiveDuration = prefersReducedMotion ? 0 : TRANSITION_MS

  // Preload neighbor full-resolution photos
  const preload = useCallback(
    (index: number) => {
      const photo = photos[index]
      if (!photo) return
      const src = getWebImageUrl(photo.src, 'full')
      if (preloadedRef.current.has(src)) return
      const img = new Image()
      img.src = src
      preloadedRef.current.add(src)
    },
    [photos]
  )

  // Fluid transition navigator
  const navigate = useCallback(
    (targetIndex: number, dir: 1 | -1) => {
      if (photos.length <= 1) return
      if (isAnimatingRef.current) return
      const nextPhoto = photos[targetIndex]
      if (!nextPhoto) return

      isAnimatingRef.current = true
      setDirection(dir)
      setIncoming({ photo: nextPhoto, index: targetIndex, dir })
      setAnimate(false)

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setAnimate(true))
      })

      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrent({ photo: nextPhoto, index: targetIndex })
        setIncoming(null)
        setAnimate(false)
        isAnimatingRef.current = false
      }, effectiveDuration || 0)

      preload((targetIndex + 1) % photos.length)
      preload((targetIndex - 1 + photos.length) % photos.length)
    },
    [photos, preload, effectiveDuration]
  )

  const goNext = useCallback(() => {
    navigate((current.index + 1) % photos.length, 1)
  }, [current.index, photos.length, navigate])

  const goPrev = useCallback(() => {
    navigate((current.index - 1 + photos.length) % photos.length, -1)
  }, [current.index, photos.length, navigate])

  // Sync initial state
  useEffect(() => {
    if (!isOpen) return
    setCurrent({ photo: photos[initialIndex] || photos[0], index: initialIndex })
    setIncoming(null)
    setAnimate(false)
    isAnimatingRef.current = false
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
    preload(initialIndex)
    preload((initialIndex + 1) % photos.length)
    preload((initialIndex - 1 + photos.length) % photos.length)
  }, [initialIndex, isOpen, photos, preload])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Sync likes from local storage and photos
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

  // Global event sync
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

  // Keyboard navigation & scroll locking
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        goNext()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, goNext, goPrev, onClose])

  const targetPhoto = incoming ? incoming.photo : current.photo
  const targetIndex = incoming ? incoming.index : current.index

  const currentLike = targetPhoto
    ? likesMap[targetPhoto.id] || {
        liked: isPhotoLikedLocally(targetPhoto.id),
        count: Number(targetPhoto.like_count) || 0,
      }
    : { liked: false, count: 0 }

  const spawnParticles = useCallback(() => {
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
  }, [])

  const playLikeAnimation = useCallback(() => {
    const now = Date.now()
    setBigHeartKey(now)
    setTimeout(() => setBigHeartKey((k) => (k === now ? null : k)), 750)

    setPulseKey((k) => k + 1)
    spawnParticles()
  }, [spawnParticles])

  // Like Toggle
  const handleLikeToggle = useCallback(
    async (photoId: string, e?: React.MouseEvent) => {
      e?.stopPropagation()
      const currentState = likesMap[photoId] || {
        liked: isPhotoLikedLocally(photoId),
        count: Number(targetPhoto?.like_count) || 0,
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
    [likesMap, targetPhoto, playLikeAnimation]
  )

  // Double-Tap to like on photo stage
  const handlePhotoClick = useCallback(
    async (photoId: string) => {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        setShowHint(false)
        const currentState = likesMap[photoId] || {
          liked: isPhotoLikedLocally(photoId),
          count: Number(targetPhoto?.like_count) || 0,
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
    [likesMap, targetPhoto, playLikeAnimation]
  )

  // Share
  const handleShare = useCallback((photo: ImageViewerPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${photo.src}` : photo.src
    if (navigator.share) {
      navigator
        .share({
          title: photo.title || 'Nepalora Photograph',
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

  // Horizontal parallax offset transitions
  const outgoingStyle: React.CSSProperties = incoming
    ? {
        transform: `translateX(${animate ? (direction === 1 ? '-4%' : '4%') : '0%'})`,
        opacity: animate ? 0 : 1,
        transition: `transform ${effectiveDuration}ms cubic-bezier(0.22,0.61,0.36,1), opacity ${effectiveDuration}ms ease`,
      }
    : { transform: 'translateX(0)', opacity: 1 }

  const incomingStyle: React.CSSProperties = incoming
    ? {
        transform: `translateX(${animate ? '0%' : incoming.dir === 1 ? '4%' : '-4%'})`,
        opacity: animate ? 1 : 0,
        transition: `transform ${effectiveDuration}ms cubic-bezier(0.22,0.61,0.36,1), opacity ${effectiveDuration}ms ease`,
      }
    : {}

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={targetPhoto.title || 'Photograph viewer'}
      onClick={onClose}
      className="
        fixed inset-0 z-[99999] flex items-center justify-center
        bg-white/85 dark:bg-black/90 backdrop-blur-xl p-2 sm:p-4 md:p-6 lg:p-10
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
          bg-white/80 hover:bg-white text-ink dark:bg-black/60 dark:hover:bg-black/85 dark:text-white
          border border-hairline dark:border-white/20 shadow-xl flex items-center justify-center
          transition-all active:scale-90 cursor-pointer backdrop-blur-md
        "
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Split-Pane Shell (Adaptive Light & Dark Modes) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-6xl max-h-[94vh] sm:max-h-[88vh]
          bg-white dark:bg-[#121212] text-ink dark:text-white
          rounded-2xl sm:rounded-3xl
          border border-hairline dark:border-white/15 shadow-2xl overflow-hidden
          flex flex-col md:flex-row
          animate-in zoom-in-95 duration-150
        "
      >
        {/* ========================================================= */}
        {/* LEFT PANE: PHOTO STAGE — Fixed size & Parallax Transition */}
        {/* ========================================================= */}
        <div
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return
            const diff = touchStartX - e.changedTouches[0].clientX
            if (diff > 45) {
              goNext()
            } else if (diff < -45) {
              goPrev()
            }
            setTouchStartX(null)
          }}
          onClick={() => handlePhotoClick(targetPhoto.id)}
          className="
            relative flex-1 bg-neutral-950 flex items-center justify-center
            h-[42vh] sm:h-[52vh] md:h-[78vh]
            p-2 sm:p-4 overflow-hidden select-none cursor-pointer
          "
          title="Double-click to like photo"
        >
          {/* Previous Arrow Button */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
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

          {/* Next Arrow Button */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
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

          {/* Fixed-Size Stage Container: Images Crossfade & Parallax Inside */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0" style={outgoingStyle}>
              <StageImage photo={current.photo} />
            </div>
            {incoming && (
              <div className="absolute inset-0" style={incomingStyle}>
                <StageImage photo={incoming.photo} />
              </div>
            )}
          </div>

          {/* Big Floating Heart Overlay */}
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
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: BRANDED SIDEBAR (Header, Caption, Actions)    */}
        {/* ========================================================= */}
        <div
          className="
            w-full md:w-[380px] lg:w-[420px] flex-shrink-0
            bg-white dark:bg-[#141414] text-ink dark:text-white
            border-t md:border-t-0 md:border-l border-hairline dark:border-white/10
            flex flex-col justify-between overflow-hidden
          "
        >
          {/* 1. TOP HEADER (Nepalora Logo Emblem + Username + Location) */}
          <div className="p-3.5 sm:p-4 border-b border-hairline dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/70 dark:bg-[#181818]/60">
            <div className="flex items-center gap-3">
              {/* Nepalora Brand Logo Emblem */}
              <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-accent-red via-accent-gold to-accent-blue flex-shrink-0 shadow-xs">
                <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center text-ink dark:text-white">
                  <Mountain className="w-4 h-4 text-accent-red dark:text-accent-gold" />
                </div>
              </div>

              <div className="leading-tight">
                <div className="flex items-center gap-1.5 font-bold text-xs text-ink dark:text-white">
                  <span>Nepalora</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-accent-blue flex items-center justify-center text-[9px] text-white font-bold">
                    ✓
                  </span>
                </div>
                <div
                  key={targetPhoto.id}
                  className="animate-in fade-in-0 duration-200"
                >
                  {targetPhoto.location ? (
                    <div className="flex items-center gap-1 text-[11px] text-ink-secondary dark:text-white/70">
                      <MapPin className="w-3 h-3 text-accent-red flex-shrink-0" />
                      <span className="truncate max-w-[180px] sm:max-w-[220px]">{targetPhoto.location}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-tertiary dark:text-white/50">Nepal Himalayas</span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-ink-tertiary dark:text-white/60 px-2.5 py-0.5 rounded-md bg-neutral-200/60 dark:bg-white/10 font-semibold">
              {targetIndex + 1}/{photos.length}
            </span>
          </div>

          {/* 2. MIDDLE CONTENT (Scrollable Post Caption) */}
          <div
            key={targetPhoto.id}
            className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 max-h-[26vh] md:max-h-[calc(88vh-180px)] animate-in fade-in-0 duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mountain className="w-3.5 h-3.5 text-accent-red dark:text-accent-blue" />
              </div>

              <div className="space-y-1.5 flex-1 text-xs text-ink-secondary dark:text-white/90 leading-relaxed">
                <p>
                  <span className="font-bold text-ink dark:text-white mr-1.5">Nepalora</span>
                  {targetPhoto.title && (
                    <span className="font-semibold text-ink dark:text-accent-gold mr-1.5">
                      {targetPhoto.title} —
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
                    {targetPhoto.caption || targetPhoto.title || 'Himalayan visual field note.'}
                  </span>
                </p>

                {(targetPhoto.category || targetPhoto.slot) && (
                  <div className="pt-2 flex items-center gap-2 text-[10px] text-ink-tertiary dark:text-white/50 uppercase font-mono tracking-wider">
                    <span>Category: {(targetPhoto.category || targetPhoto.slot || '').replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. BOTTOM ACTION BAR (Like + Share + Pure Count) */}
          <div className="p-3.5 sm:p-4 border-t border-hairline dark:border-white/10 bg-neutral-50/70 dark:bg-[#181818]/60 space-y-2">
            <div className="flex items-center gap-4">
              {/* Like Button with Radial Particle Burst */}
              <button
                type="button"
                onClick={(e) => handleLikeToggle(targetPhoto.id, e)}
                aria-label={currentLike.liked ? 'Unlike' : 'Like'}
                aria-pressed={currentLike.liked}
                className="relative w-7 h-7 flex items-center justify-center cursor-pointer p-0 bg-transparent border-0 select-none"
                title={currentLike.liked ? 'Unlike' : 'Like'}
              >
                {/* Outline Heart */}
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

                {/* Filled Heart */}
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

              {/* Share Plane */}
              <button
                type="button"
                onClick={(e) => handleShare(targetPhoto, e)}
                aria-label="Share photo"
                className="flex items-center gap-1.5 transition-transform active:scale-110 cursor-pointer text-ink dark:text-white hover:opacity-80"
                title="Share photo link"
              >
                {copiedShare ? (
                  <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 text-xs font-semibold">
                    <Check className="w-5 h-5" />
                    <span>Link Copied</span>
                  </div>
                ) : (
                  <Send className="w-5 h-5 rotate-[15deg] transition-transform hover:translate-x-0.5 hover:-translate-y-0.5" />
                )}
              </button>
            </div>

            {/* Clean Bold Like Counter Only */}
            <p className="font-bold text-xs text-ink dark:text-white">
              {currentLike.count.toLocaleString()}{' '}
              {currentLike.count === 1 ? 'like' : 'likes'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
