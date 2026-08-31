'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, ArrowRight, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at?: string
  category?: {
    name: string
    slug: string
  }
}

interface InstantSearchBarProps {
  placeholder?: string
  autoFocus?: boolean
  initialQuery?: string
  className?: string
  onSelect?: () => void
}

export function InstantSearchBar({
  placeholder = 'Search Nepal (e.g. Mardi Himal, visa, yoga, altitude)...',
  autoFocus = false,
  initialQuery = '',
  className = '',
  onSelect,
}: InstantSearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch (err) {
        console.warn('Instant search error:', err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      if (onSelect) onSelect()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className="
            w-full pl-11 pr-24 py-3 sm:py-3.5 min-h-[48px] bg-bg-elevated border border-hairline
            rounded-pill shadow-xs focus:outline-none focus:border-hairline-strong
            text-ink text-xs sm:text-sm placeholder:text-ink-tertiary transition-all
          "
        />
        <Search className="absolute left-4 w-4 h-4 text-ink-tertiary pointer-events-none" />

        {/* Clear / Loading indicator / Search button */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {loading ? (
            <div className="px-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
            </div>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search query"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-ink-tertiary hover:text-ink rounded-pill transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex min-h-[36px]"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Live Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-bg-elevated rounded-2xl shadow-lg border border-hairline overflow-hidden z-50 animate-in fade-in-0 duration-150">
          <div className="p-2 border-b border-hairline bg-bg flex items-center justify-between text-[11px] text-ink-tertiary font-medium px-4">
            <span>
              {loading
                ? 'Searching guides...'
                : `${results.length} ${results.length === 1 ? 'guide found' : 'guides found'}`}
            </span>
            <span>Instant Search</span>
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-hairline">
            {results.length > 0 ? (
              results.map((art) => (
                <Link
                  key={art.id}
                  href={`/article/${art.slug}`}
                  onClick={() => {
                    setIsOpen(false)
                    if (onSelect) onSelect()
                  }}
                  className="block p-3.5 hover:bg-bg transition-colors text-left group min-h-[56px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone="blue">{art.category?.name || 'Guide'}</Badge>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-ink underline-draw transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-ink-secondary line-clamp-1 mt-0.5">
                    {art.excerpt}
                  </p>
                </Link>
              ))
            ) : !loading ? (
              <div className="p-6 text-center text-xs text-ink-tertiary space-y-1">
                <p className="font-semibold text-ink">No matching articles found</p>
                <p>Try searching for &quot;trekking&quot;, &quot;visa&quot;, &quot;yoga&quot;, or &quot;altitude&quot;.</p>
              </div>
            ) : null}
          </div>

          {results.length > 0 && (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => {
                setIsOpen(false)
                if (onSelect) onSelect()
              }}
              className="block py-3 px-4 bg-bg hover:bg-bg-elevated border-t border-hairline text-xs font-semibold text-center text-ink transition-colors min-h-[44px]"
            >
              <span className="flex items-center justify-center gap-1.5">
                View all results for &quot;{query}&quot; <ArrowRight className="w-3.5 h-3.5 text-accent-blue" />
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
