'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function ManageArticlesClientPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
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

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || art.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Editorial Library</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Article Management
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Overview of all published, drafted, and archived Soul of Nepal guides.
          </p>
        </div>

        <Link
          href="/staff/import"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-pill text-xs font-semibold text-white shadow-sm transition-all active:scale-95 flex-shrink-0"
          style={{ backgroundImage: 'var(--accent-gradient)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Import New Guide</span>
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
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles by title, slug..."
            className="w-full pl-9 pr-4 py-2.5 min-h-[44px] bg-bg-elevated border border-hairline rounded-pill text-xs text-ink focus:outline-none focus:border-hairline-strong transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-bg-elevated border border-hairline p-1 rounded-pill text-xs font-semibold overflow-x-auto">
          {['all', 'published', 'draft', 'archived'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-pill capitalize transition-all min-h-[36px] text-xs cursor-pointer ${
                selectedStatus === st
                  ? 'bg-ink text-bg shadow-xs font-bold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center text-ink-tertiary">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
      ) : (
        <>
          {/* Mobile Card List (Shown on mobile screens < 640px) */}
          <div className="block sm:hidden space-y-3">
            {filteredArticles.length === 0 ? (
              <div className="p-8 border border-dashed border-hairline rounded-2xl text-center text-ink-tertiary bg-bg-elevated space-y-2">
                <FileText className="w-6 h-6 mx-auto text-ink-tertiary" />
                <p className="font-semibold text-ink">No articles matched your criteria.</p>
              </div>
            ) : (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 rounded-xl border border-hairline bg-bg-elevated shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={art.status === 'published' ? 'blue' : 'neutral'}>
                      {art.status}
                    </Badge>
                    <span className="text-[10px] font-mono text-ink-tertiary">
                      {new Date(art.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-sm text-ink leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-ink-tertiary font-mono mt-0.5">/{art.slug}</p>
                  </div>

                  <div className="pt-2 border-t border-hairline flex items-center justify-between">
                    <span className="text-xs text-ink-secondary">{art.category?.name || 'General'}</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/article/${art.slug}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-secondary hover:text-ink"
                        title="View Live Guide"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/staff/import?edit=${art.slug}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-accent-blue"
                        title="Edit Guide"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(art.id, art.title)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-accent-red"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (Hidden on mobile screens < 640px) */}
          <div className="hidden sm:block border border-hairline rounded-2xl bg-bg-elevated overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg border-b border-hairline text-ink-tertiary uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Title & Slug</th>
                    <th className="px-4 py-3">Category Pillar</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-ink-tertiary space-y-2">
                        <FileText className="w-6 h-6 mx-auto text-ink-tertiary" />
                        <p className="font-semibold text-ink">No articles matched your criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-bg/60 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/article/${art.slug}`}
                            className="font-bold text-ink hover:text-accent-blue block line-clamp-1 underline-draw"
                          >
                            {art.title}
                          </Link>
                          <span className="text-[10px] text-ink-tertiary font-mono">/{art.slug}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-bg px-2.5 py-1 rounded-pill border border-hairline text-ink font-medium">
                            {art.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={art.status === 'published' ? 'blue' : 'neutral'}>
                            {art.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-tertiary text-[11px] font-mono">
                          {new Date(art.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link
                            href={`/article/${art.slug}`}
                            className="inline-p-1 text-ink-secondary hover:text-ink"
                            title="View Live Guide"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </Link>
                          <Link
                            href={`/staff/import?edit=${art.slug}`}
                            className="inline-p-1 text-accent-blue"
                            title="Edit Guide"
                          >
                            <Edit3 className="w-4 h-4 inline" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            className="inline-p-1 text-accent-red"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
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
