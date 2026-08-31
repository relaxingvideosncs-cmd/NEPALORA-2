'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { BulletinRecord } from '@/types/database'
import { Badge } from '@/components/ui/Badge'

interface BulletinBannerProps {
  bulletins: BulletinRecord[]
}

export function BulletinBanner({ bulletins }: BulletinBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('soulofnepal_dismissed_bulletins')
      if (saved) {
        setDismissedIds(JSON.parse(saved))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  if (!mounted || !bulletins || bulletins.length === 0) {
    return null
  }

  // Find the highest priority bulletin not yet dismissed
  const activeBulletin = bulletins.find((b) => !dismissedIds.includes(b.id))

  if (!activeBulletin) {
    return null
  }

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id]
    setDismissedIds(updated)
    try {
      localStorage.setItem('soulofnepal_dismissed_bulletins', JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  const targetLink = activeBulletin.article?.slug
    ? `/article/${activeBulletin.article.slug}`
    : activeBulletin.link_url

  return (
    <aside
      className="bg-bg-elevated border-b border-hairline text-ink text-xs py-2 px-4 relative z-50 transition-all shadow-xs"
      aria-label="Urgent Trail Advisory Announcement"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
          <Badge tone="red" className="flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Advisory
          </Badge>

          {activeBulletin.picture_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeBulletin.picture_url}
              alt=""
              className="w-5 h-5 rounded object-cover flex-shrink-0 border border-hairline"
            />
          )}

          <div className="truncate flex items-center gap-2">
            <strong className="font-semibold text-ink truncate">{activeBulletin.title}:</strong>
            <span className="text-ink-secondary truncate hidden sm:inline">{activeBulletin.notice}</span>
          </div>

          {targetLink && (
            <Link
              href={targetLink}
              target={targetLink.startsWith('http') ? '_blank' : undefined}
              rel={targetLink.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1 font-semibold text-accent-red hover:underline flex-shrink-0 ml-1"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleDismiss(activeBulletin.id)}
          className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-ink-tertiary hover:text-ink transition-colors flex-shrink-0 active:scale-95"
          title="Dismiss advisory"
          aria-label="Dismiss advisory"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
