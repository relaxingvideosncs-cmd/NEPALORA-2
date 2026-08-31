'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shuffle, Loader2 } from 'lucide-react'

interface RandomReadButtonProps {
  slugs?: string[]
  className?: string
}

const FALLBACK_SLUGS = [
  'best-time-to-trek-in-nepal',
  'everest-base-camp-trek-guide',
  'annapurna-circuit-guide',
  'nepal-visa-on-arrival-guide',
  'sound-healing-kathmandu-guide',
]

export function RandomReadButton({ slugs = [], className = '' }: RandomReadButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRandomRead = () => {
    setLoading(true)
    const available = slugs.length > 0 ? slugs : FALLBACK_SLUGS
    const randomSlug = available[Math.floor(Math.random() * available.length)]

    // If it's a relative path or standard article slug
    const targetUrl = randomSlug.startsWith('/') ? randomSlug : `/article/${randomSlug}`
    router.push(targetUrl)
  }

  return (
    <button
      type="button"
      onClick={handleRandomRead}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-pill
        border border-hairline bg-bg-elevated hover:bg-bg
        text-ink text-xs font-semibold hover:border-hairline-strong
        transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ${className}
      `}
      title="Discover a random article about Nepal"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-red" />
      ) : (
        <Shuffle className="w-3.5 h-3.5 text-accent-red" />
      )}
      <span>Random Read about Nepal</span>
    </button>
  )
}
