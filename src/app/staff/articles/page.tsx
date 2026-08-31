'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  ArrowUpDown,
  Layers,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

type SortOption = 'newest' | 'oldest' | 'updated' | 'title'

export default function ManageArticlesClientPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles')
      if (res.ok) {
        const data = await res.json()
        if (data.articles) setArticles(data.articles)
      }
    } catch (err) {
      console.warn('Could not fetch articles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  // Extract unique category names and counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length }
    articles.forEach((art) => {
      const cat = art.category?.name || 'General'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [articles])

  const categoriesList = useMemo(() => {
    const list = Object.keys(categoryCounts).filter((c) => c !== 'all')
    return ['all', ...list]
  }, [categoryCounts])

  // 1-Click Instant Visibility Toggle (Live <-> Disabled)
  const handleToggleVisibility = async (article: any) => {
    const isCurrentlyPublished = article.status === 'published'
    const newStatus = isCurrentlyPublished ? 'draft' : 'published'
    const actionLabel = isCurrentlyPublished ? 'Disabled / Hidden' : 'Published / Live'

    setTogglingId(article.id)

    // Optimistic UI update
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, status: newStatus } : a))
    )

    try {
      const res = await fetch('/api/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article.id, status: newStatus }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update visibility')

      setNotice({
        type: 'success',
        message: `"${article.title}" is now ${actionLabel}.`,
      })
    } catch (err: any) {
      // Rollback on failure
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: article.status } : a))
      )
      setNotice({
        type: 'error',
        message: err.message || 'Failed to update article visibility',
      })
    } finally {
      setTogglingId(null)
      setTimeout(() => setNotice(null), 4000)
    }
  }

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Delete failed')

      setNotice({ type: 'success', message: `Article "${title}" deleted successfully.` })
      fetchArticles()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete article' })
    } finally {
      setTimeout(() => setNotice(null), 5000)
    }
  }

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    return articles
      .filter((art) => {
        const catName = art.category?.name || 'General'
        const matchesCategory = selectedCategory === 'all' || catName === selectedCategory

        const matchesSearch =
          searchTerm === '' ||
          art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          catName.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || a.updated_at).getTime() - new Date(b.created_at || b.updated_at).getTime()
        }
        if (sortBy === 'updated') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '')
        }
        return 0
      })
  }, [articles, selectedCategory, searchTerm, sortBy])

  return (
    <div className="space-y-6 py-2 sm:py-4 max-w-7xl">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Editorial Library</Badge>
            <span className="text-xs text-ink-tertiary">
              {articles.length} article{articles.length !== 1 ? 's' : ''} total
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Article Management
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Manage your guides, toggle instant live visibility, filter by category, and edit content.
          </p>
        </div>

        <Link
          href="/staff/import"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-pill text-xs font-semibold text-white shadow-sm transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          style={{ backgroundImage: 'var(--accent-gradient)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Guide</span>
        </Link>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Control Bar: Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles by title, slug, category..."
            className="w-full pl-9 pr-4 py-2.5 min-h-[42px] bg-bg-elevated border border-hairline rounded-pill text-xs text-ink focus:outline-none focus:border-hairline-strong transition-all placeholder:text-ink-tertiary shadow-2xs"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-ink-tertiary flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-bg-elevated border border-hairline rounded-pill text-xs font-semibold text-ink focus:outline-none focus:border-hairline-strong cursor-pointer shadow-2xs min-h-[40px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
            <option value="title">Alphabetical (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-xs font-semibold text-ink-tertiary flex items-center gap-1 mr-1 flex-shrink-0">
          <Layers className="w-3.5 h-3.5" />
          Category:
        </span>
        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat
          const count = categoryCounts[cat] || 0
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-pill flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[34px] border ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-xs font-bold'
                  : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline hover:border-hairline-strong'
              }`}
            >
              <span>{cat === 'all' ? 'All Guides' : cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-pill ${
                  isSelected
                    ? 'bg-white/20 dark:bg-black/20 text-inherit'
                    : 'bg-bg text-ink-tertiary'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-ink-tertiary">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          <span className="text-xs font-medium">Loading articles...</span>
        </div>
      ) : (
        <>
          {/* Mobile Card List (Screens < 640px) */}
          <div className="block sm:hidden space-y-3">
            {filteredArticles.length === 0 ? (
              <div className="p-8 border border-dashed border-hairline rounded-2xl text-center text-ink-tertiary bg-bg-elevated space-y-2">
                <FileText className="w-6 h-6 mx-auto text-ink-tertiary" />
                <p className="font-semibold text-ink">No articles match your filters.</p>
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isPublished = art.status === 'published'
                const isToggling = togglingId === art.id
                return (
                  <div
                    key={art.id}
                    className="p-4 rounded-2xl border border-hairline bg-bg-elevated shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-bg px-2.5 py-0.5 rounded-pill border border-hairline text-ink font-semibold text-[11px]">
                        {art.category?.name || 'General'}
                      </span>
                      <span className="text-[10px] font-mono text-ink-tertiary flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(art.created_at || art.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-sm text-ink leading-snug">
                        {art.title}
                      </h3>
                      <p className="text-[11px] text-ink-tertiary font-mono mt-0.5">/{art.slug}</p>
                    </div>

                    {/* Mobile Bottom Actions with Disable/Enable Toggle */}
                    <div className="pt-2.5 border-t border-hairline flex items-center justify-between gap-2">
                      {/* Visibility Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(art)}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors cursor-pointer border ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20 hover:bg-neutral-500/20'
                        }`}
                        title={isPublished ? 'Click to disable' : 'Click to enable'}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPublished ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>{isPublished ? 'Live' : 'Disabled'}</span>
                      </button>

                      {/* Tool Actions */}
                      <div className="flex items-center gap-1">
                        {isPublished && (
                          <Link
                            href={`/article/${art.slug}`}
                            target="_blank"
                            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-ink-secondary hover:text-ink rounded-lg"
                            title="View Live Guide"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/staff/import?edit=${art.slug}`}
                          className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-accent-blue rounded-lg"
                          title="Edit Guide"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id, art.title)}
                          className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-accent-red rounded-lg cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block border border-hairline rounded-2xl bg-bg-elevated overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg/80 border-b border-hairline text-ink-tertiary uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-6 py-4 min-w-[280px]">Article Title &amp; Slug</th>
                    <th className="px-6 py-4 min-w-[130px]">Category</th>
                    <th className="px-6 py-4 min-w-[140px]">Visibility Status</th>
                    <th className="px-6 py-4 min-w-[120px]">Date Added</th>
                    <th className="px-6 py-4 text-right min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-ink-tertiary space-y-2">
                        <FileText className="w-7 h-7 mx-auto text-ink-tertiary" />
                        <p className="font-semibold text-ink mt-2">No articles match your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => {
                      const isPublished = art.status === 'published'
                      const isToggling = togglingId === art.id
                      return (
                        <tr key={art.id} className="hover:bg-bg/50 transition-colors group">
                          {/* Title & Slug */}
                          <td className="px-6 py-4 max-w-sm">
                            <Link
                              href={`/article/${art.slug}`}
                              className="font-bold text-xs text-ink hover:text-accent-blue block line-clamp-2 leading-snug"
                            >
                              {art.title}
                            </Link>
                            <span className="text-[11px] text-ink-tertiary font-mono mt-0.5 block">
                              /{art.slug}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-bg px-2.5 py-1 rounded-pill border border-hairline text-ink font-semibold text-[11px]">
                              {art.category?.name || 'General'}
                            </span>
                          </td>

                          {/* 1-Click Visibility Toggle (Live / Disabled) */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(art)}
                              disabled={isToggling}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-semibold transition-all cursor-pointer border ${
                                isPublished
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-2xs'
                                  : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20 hover:bg-neutral-500/20'
                              }`}
                              title={isPublished ? 'Click to Disable (hide from public)' : 'Click to Enable (publish live)'}
                            >
                              {isToggling ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isPublished ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                              <span>{isPublished ? 'Live' : 'Disabled'}</span>
                            </button>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 text-ink-tertiary text-[11px] font-mono whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-ink-tertiary" />
                              {new Date(art.created_at || art.updated_at).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Action Toolbar */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPublished && (
                                <Link
                                  href={`/article/${art.slug}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg border border-hairline/50 text-ink-secondary hover:text-ink hover:bg-bg transition-colors"
                                  title="View Live Guide"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                              <Link
                                href={`/staff/import?edit=${art.slug}`}
                                className="p-1.5 rounded-lg border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 transition-colors"
                                title="Edit Guide in Studio"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(art.id, art.title)}
                                className="p-1.5 rounded-lg border border-accent-red/20 text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                                title="Delete Article"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
