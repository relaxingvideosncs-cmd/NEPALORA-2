'use client'

import React, { useState, useMemo } from 'react'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Badge } from '@/components/ui/Badge'
import {
  Search,
  X,
  SlidersHorizontal,
  BookOpen,
  ArrowUpDown,
  Compass,
  Mountain,
  HeartHandshake,
  Sparkles,
} from 'lucide-react'

interface ArticleItem {
  id: string
  title: string
  slug: string
  excerpt: string
  content_json?: any
  published_at?: string
  created_at?: string
  category?: {
    id?: string
    name: string
    slug: string
  }
}

interface AllArticlesBrowserProps {
  initialArticles: ArticleItem[]
}

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

export function AllArticlesBrowser({ initialArticles = [] }: AllArticlesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Categories list with counts
  const categories = [
    { slug: 'all', label: 'All Articles', icon: Sparkles },
    { slug: 'prepare-for-nepal', label: 'Preparation for Nepal', icon: Compass },
    { slug: 'trekking-adventure', label: 'Trekking & Adventure', icon: Mountain },
    { slug: 'recovery-healing', label: 'Recovery & Healing', icon: HeartHandshake },
  ]

  // Filter & Sort Pipeline
  const filteredArticles = useMemo(() => {
    let result = [...initialArticles]

    // 1. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((art) => art.category?.slug === selectedCategory)
    }

    // 2. Client-side Search Filter (Independent from global search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((art) => {
        const titleMatch = (art.title || '').toLowerCase().includes(q)
        const excerptMatch = (art.excerpt || '').toLowerCase().includes(q)
        const catMatch = (art.category?.name || '').toLowerCase().includes(q)
        const tags = Array.isArray(art.content_json?.tags)
          ? art.content_json.tags.join(' ').toLowerCase()
          : ''
        const tagMatch = tags.includes(q)
        return titleMatch || excerptMatch || catMatch || tagMatch
      })
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.published_at || a.created_at || 0).getTime()
        const dateB = new Date(b.published_at || b.created_at || 0).getTime()
        return dateB - dateA
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.published_at || a.created_at || 0).getTime()
        const dateB = new Date(b.published_at || b.created_at || 0).getTime()
        return dateA - dateB
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '')
      }
      if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '')
      }
      return 0
    })

    return result
  }, [initialArticles, selectedCategory, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSortBy('newest')
  }

  return (
    <div className="space-y-8">
      {/* 1. Interactive Filter & Search Controls Bar */}
      <div className="bg-bg-elevated p-4 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-4">
        {/* Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* On-Page Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, topic, or keyword (e.g. Annapurna, Visa, Sound Healing)..."
              className="
                w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm
                bg-bg border border-hairline text-ink placeholder:text-ink-tertiary
                focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue
                transition-all
              "
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-tertiary absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort articles"
                className="
                  pl-8 pr-8 py-2.5 rounded-xl text-xs font-semibold
                  bg-bg border border-hairline text-ink
                  focus:outline-none focus:border-accent-blue
                  cursor-pointer appearance-none min-h-[42px]
                "
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A → Z)</option>
                <option value="title-desc">Title (Z → A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.slug
            const count =
              cat.slug === 'all'
                ? initialArticles.length
                : initialArticles.filter((a) => a.category?.slug === cat.slug).length

            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold
                  whitespace-nowrap transition-all cursor-pointer select-none min-h-[36px]
                  ${
                    isSelected
                      ? 'bg-ink text-bg shadow-2xs'
                      : 'bg-bg text-ink-secondary hover:text-ink border border-hairline hover:border-hairline-strong'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`
                    ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono
                    ${isSelected ? 'bg-bg/20 text-bg' : 'bg-bg-elevated text-ink-tertiary border border-hairline'}
                  `}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Results Header & Count */}
      <div className="flex items-center justify-between text-xs text-ink-secondary border-b border-hairline pb-3">
        <div>
          <span>
            Showing <strong className="text-ink">{filteredArticles.length}</strong> of{' '}
            {initialArticles.length} articles
          </span>
          {searchQuery && (
            <span className="ml-2 text-ink-tertiary">
              matching &ldquo;<strong className="text-ink">{searchQuery}</strong>&rdquo;
            </span>
          )}
        </div>

        {(searchQuery || selectedCategory !== 'all' || sortBy !== 'newest') && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-accent-blue hover:underline text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 3. Article Grid */}
      {filteredArticles.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-hairline-strong rounded-2xl bg-bg-elevated space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-ink-tertiary" />
          <h3 className="font-display font-bold text-lg text-ink">No matching articles found</h3>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category filter.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-2 px-4 py-2 bg-ink text-bg text-xs font-semibold rounded-pill hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
          >
            Show All Articles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article as any} />
          ))}
        </div>
      )}
    </div>
  )
}
