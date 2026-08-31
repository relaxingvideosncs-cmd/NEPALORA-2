'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Trash2,
  Square,
  CheckSquare,
  Layers,
  AlertCircle,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getWebImageUrl } from '@/lib/cloudinary/imageHelper'

interface MediaUsage {
  type: 'article' | 'gallery' | 'bulletin' | 'setting'
  title: string
  detail?: string
}

interface EnrichedMediaRecord {
  id: string
  cloudinary_public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes?: number
  alt_text?: string | null
  title?: string | null
  caption?: string | null
  credit?: string | null
  created_at?: string
  used_in?: MediaUsage[]
  is_unused?: boolean
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function MediaLibraryClientPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'in_use' | 'unused'>('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [mediaItems, setMediaItems] = useState<EnrichedMediaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/upload')
      if (res.ok) {
        const data = await res.json()
        if (data.media) setMediaItems(data.media)
      }
    } catch (err) {
      console.warn('Could not fetch media list:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set())
  }, [filterTab])

  const handleUploadFromGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setNotice(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('folder', 'nepalora/misc')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      setNotice({ type: 'success', message: `"${file.name}" uploaded to Cloudinary.` })
      fetchMedia()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Image upload failed' })
    } finally {
      setUploading(false)
      setTimeout(() => setNotice(null), 6000)
    }
  }

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Single delete
  const handleDeleteMedia = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" from Supabase database and Cloudinary storage?`)) return

    try {
      const res = await fetch(`/api/upload?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Deletion failed')

      setNotice({ type: 'success', message: `Deleted "${name}".` })
      setMediaItems((prev) => prev.filter((m) => m.id !== id))
      setSelectedIds((prev) => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
      setTimeout(() => setNotice(null), 4000)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete image' })
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    setNotice(null)
    try {
      const ids = Array.from(selectedIds)
      const res = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Bulk deletion failed')

      setNotice({ type: 'success', message: `Deleted ${ids.length} image(s) from database and Cloudinary.` })
      setMediaItems((prev) => prev.filter((m) => !selectedIds.has(m.id)))
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Bulk delete failed' })
    } finally {
      setBulkDeleting(false)
      setTimeout(() => setNotice(null), 6000)
    }
  }

  // Toggle single item selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filtered Media Calculation
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      // Tab filter
      if (filterTab === 'in_use' && item.is_unused) return false
      if (filterTab === 'unused' && !item.is_unused) return false

      // Search query filter
      if (!searchFilter.trim()) return true
      const q = searchFilter.toLowerCase()
      const titleMatch = (item.title || '').toLowerCase().includes(q)
      const altMatch = (item.alt_text || '').toLowerCase().includes(q)
      const formatMatch = (item.format || '').toLowerCase().includes(q)
      const usageMatch = (item.used_in || []).some((u) => u.title.toLowerCase().includes(q))
      return titleMatch || altMatch || formatMatch || usageMatch
    })
  }, [mediaItems, filterTab, searchFilter])

  const unusedCount = useMemo(() => mediaItems.filter((m) => m.is_unused).length, [mediaItems])
  const inUseCount = useMemo(() => mediaItems.filter((m) => !m.is_unused).length, [mediaItems])

  const allFilteredSelected =
    filteredMedia.length > 0 && filteredMedia.every((m) => selectedIds.has(m.id))

  // Select all currently visible filtered media
  const handleSelectAllVisible = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredMedia.forEach((m) => next.delete(m.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredMedia.forEach((m) => next.add(m.id))
        return next
      })
    }
  }

  // Select all unused media across the library
  const handleSelectAllUnused = () => {
    const unusedIds = mediaItems.filter((m) => m.is_unused).map((m) => m.id)
    setSelectedIds(new Set(unusedIds))
    setFilterTab('unused')
    setNotice({
      type: 'success',
      message: `Selected all ${unusedIds.length} unused image(s).`,
    })
    setTimeout(() => setNotice(null), 4000)
  }

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-6">
      {/* Header */}
      <header className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Media Assets</Badge>
            <span className="text-xs text-ink-tertiary">
              {mediaItems.length} Total Master Assets
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Media Library
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Cloudinary media management. Tracks usage across articles, galleries, bulletins, and site settings.
          </p>
        </div>

        {/* Upload Action */}
        <div>
          <input
            type="file"
            id="media-upload-input"
            accept="image/*"
            onChange={handleUploadFromGallery}
            className="hidden"
          />
          <label
            htmlFor="media-upload-input"
            className="cursor-pointer py-2.5 px-4 min-h-[44px] inline-flex items-center gap-2 text-xs font-semibold text-white rounded-pill shadow-xs transition-all active:scale-95 select-none"
            style={{ backgroundImage: 'var(--accent-gradient)' }}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          </label>
        </div>
      </header>

      {/* Notifications */}
      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-accent-red flex-shrink-0" />
          )}
          <span className="flex-1">{notice.message}</span>
          <button onClick={() => setNotice(null)} className="ml-auto text-ink-tertiary hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-hairline pb-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer border ${
              filterTab === 'all'
                ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline'
            }`}
          >
            All Media ({mediaItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('in_use')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer border ${
              filterTab === 'in_use'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline'
            }`}
          >
            In Use ({inUseCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('unused')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer border ${
              filterTab === 'unused'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline'
            }`}
          >
            Unused ({unusedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by title, format, or usage..."
            className="w-full pl-8 pr-3 py-1.5 min-h-[36px] text-xs bg-bg-elevated border border-hairline rounded-pill text-ink focus:outline-none focus:border-hairline-strong placeholder:text-ink-tertiary"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-select Toolbar */}
      {!loading && mediaItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-bg-elevated/70 border border-hairline">
          <div className="flex flex-wrap items-center gap-2">
            {/* Select All Visible toggle */}
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-pill border border-hairline bg-bg text-xs font-semibold text-ink hover:text-ink transition-colors cursor-pointer"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-accent-blue" />
              ) : (
                <Square className="w-3.5 h-3.5 text-ink-tertiary" />
              )}
              <span>{allFilteredSelected ? 'Deselect Tab' : 'Select Visible'}</span>
            </button>

            {/* Quick Action: Select All Unused */}
            {unusedCount > 0 && (
              <button
                type="button"
                onClick={handleSelectAllUnused}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-pill border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Select All Unused ({unusedCount})</span>
              </button>
            )}
          </div>

          {/* Bulk Delete Trigger */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-secondary">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[34px] rounded-pill border border-accent-red/30 bg-accent-red/10 text-xs font-semibold text-accent-red hover:bg-accent-red/20 transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedIds.size}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-ink-tertiary hover:text-ink cursor-pointer px-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid of Media Assets */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-accent-blue" />
          <p className="text-xs text-ink-secondary">Analyzing media usage and storage footprint...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-2xl p-12 text-center text-ink-tertiary bg-bg-elevated/40 space-y-3">
          <ImageIcon className="w-8 h-8 mx-auto text-ink-tertiary" />
          <p className="font-semibold text-ink">
            {searchFilter
              ? 'No media matches your search query.'
              : filterTab === 'unused'
              ? 'Great news! All media assets are currently in use.'
              : filterTab === 'in_use'
              ? 'No assets in use yet.'
              : 'No Cloudinary uploads yet.'}
          </p>
          <p className="text-xs text-ink-tertiary max-w-sm mx-auto">
            {searchFilter ? 'Try searching for a different keyword or format.' : 'Upload photos or sync articles to populate.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredMedia.map((item) => {
            const isSelected = selectedIds.has(item.id)
            const usages = item.used_in || []
            const isUnused = item.is_unused

            return (
              <div
                key={item.id}
                className={`border rounded-2xl overflow-hidden bg-bg-elevated shadow-xs group flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-accent-blue ring-2 ring-accent-blue/30'
                    : 'border-hairline hover:border-hairline-strong'
                }`}
              >
                {/* Thumbnail Preview Area */}
                <div
                  className="aspect-video bg-neutral-900/10 relative overflow-hidden cursor-pointer"
                  onClick={() => toggleSelect(item.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getWebImageUrl(item.secure_url, 'card')}
                    alt={item.alt_text || 'Media asset'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (target.src !== item.secure_url) {
                        target.src = item.secure_url
                      }
                    }}
                  />

                  {/* Top-Left Selection Checkbox */}
                  <div
                    className={`absolute top-2.5 left-2.5 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-accent-blue border-accent-blue text-white shadow-xs'
                          : 'bg-black/60 border-white/40 text-transparent backdrop-blur-xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Top-Right Usage Flag Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isUnused ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/90 text-white rounded-pill shadow-xs backdrop-blur-xs">
                        Unused
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-600/90 text-white rounded-pill shadow-xs backdrop-blur-xs">
                        In Use ({usages.length})
                      </span>
                    )}
                  </div>

                  {/* Bottom-Right File Size Badge */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono rounded-md">
                    {formatBytes(item.bytes)}
                  </div>

                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-accent-blue/15 pointer-events-none" />
                  )}
                </div>

                {/* Content & Metadata */}
                <div className="p-3 text-[11px] text-ink-secondary space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <p
                      className="font-semibold text-ink truncate text-xs"
                      title={item.alt_text || item.title || 'Untitled Image'}
                    >
                      {item.alt_text || item.title || 'Untitled Image'}
                    </p>

                    {/* Format and Dimensions */}
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-ink-tertiary font-mono">
                      <span className="uppercase px-1.5 py-0.2 bg-bg rounded border border-hairline font-bold">
                        {item.format || 'JPG'}
                      </span>
                      {item.width > 0 && item.height > 0 && (
                        <span>
                          {item.width}×{item.height}
                        </span>
                      )}
                    </div>

                    {/* Referenced In Details */}
                    {usages.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] text-ink-tertiary block font-semibold">
                          Referenced in:
                        </span>
                        <div className="space-y-0.5">
                          {usages.slice(0, 2).map((u, i) => (
                            <p
                              key={i}
                              className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1"
                              title={`${u.type.toUpperCase()}: ${u.title}`}
                            >
                              <span className="capitalize font-semibold text-ink-tertiary">[{u.type}]</span>
                              <span className="truncate">{u.title}</span>
                            </p>
                          ))}
                          {usages.length > 2 && (
                            <span className="text-[10px] text-ink-tertiary italic">
                              +{usages.length - 2} more references
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                        Not referenced in any article or gallery.
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-hairline">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.secure_url, item.id)}
                      className="inline-flex items-center gap-1 text-ink-secondary hover:text-ink font-semibold transition-colors min-h-[32px] cursor-pointer"
                      title="Copy CDN Secure URL"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={getWebImageUrl(item.secure_url, 'full') || item.secure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-ink-tertiary hover:text-ink rounded-md transition-colors"
                        title="View Full Resolution Master"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id, item.alt_text || item.title || 'asset')}
                        className="p-1.5 text-ink-tertiary hover:text-accent-red rounded-md transition-colors cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bg-elevated border border-hairline rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-accent-red">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h2 className="font-display font-bold text-lg text-ink">
                Confirm Permanent Bulk Deletion
              </h2>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              You are about to permanently delete{' '}
              <strong className="text-ink">{selectedIds.size} asset(s)</strong> from your Supabase
              database and Cloudinary cloud storage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-accent-red hover:bg-accent-red/90 text-white border-none"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  `Delete ${selectedIds.size} Assets`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
