'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { MediaRecord } from '@/types/database'
import { compressImageClient } from '@/lib/cloudinary/clientCompress'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { NEPAL_PHOTOS } from '@/lib/data/nepalImages'

export default function MediaLibraryClientPage() {
  const [activeTab, setActiveTab] = useState<'cloud' | 'curated'>('cloud')
  const [searchFilter, setSearchFilter] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaRecord[]>([])
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
  }, [activeTab])

  const handleUploadFromGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setNotice(null)

    try {
      const compressed = await compressImageClient(file)
      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''))

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      setNotice({ type: 'success', message: `"${file.name}" uploaded to Cloudinary.` })
      setActiveTab('cloud')
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
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
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

  // Select all visible media
  const handleSelectAll = () => {
    if (selectedIds.size === mediaItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(mediaItems.map((m) => m.id)))
    }
  }

  // Select unused media (not referenced by any gallery, article cover, or bulletin)
  // We can only do client-side URL matching here — items with no seo alt or title are likely "unused"
  // A robust implementation would compare secure_urls against article/gallery/bulletin records
  const handleSelectUnused = async () => {
    try {
      // Fetch all referenced image URLs from articles + galleries + bulletins
      const [artRes, galRes, bulRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/galleries'),
        fetch('/api/bulletins'),
      ])
      const [artData, galData, bulData]: any[] = await Promise.all([
        artRes.ok ? artRes.json() : {},
        galRes.ok ? galRes.json() : {},
        bulRes.ok ? bulRes.json() : {},
      ])

      const usedUrls = new Set<string>()

      // Collect article cover images
      ;(artData.articles || []).forEach((a: any) => {
        if (a.cover_image_url) usedUrls.add(a.cover_image_url)
      })
      // Collect gallery photo URLs
      ;(galData.items || []).forEach((g: any) => {
        if (g.image_url) usedUrls.add(g.image_url)
      })
      // Collect bulletin picture URLs
      ;(bulData.bulletins || []).forEach((b: any) => {
        if (b.picture_url) usedUrls.add(b.picture_url)
      })

      const unusedIds = mediaItems
        .filter((m) => !usedUrls.has(m.secure_url))
        .map((m) => m.id)

      setSelectedIds(new Set(unusedIds))
      setNotice({
        type: 'success',
        message: `Selected ${unusedIds.length} unused image(s) not referenced anywhere.`,
      })
      setTimeout(() => setNotice(null), 5000)
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Could not determine unused images: ' + err.message })
    }
  }

  const filteredCurated = NEPAL_PHOTOS.filter((p) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.caption?.toLowerCase().includes(q)
  })

  const allSelected = mediaItems.length > 0 && selectedIds.size === mediaItems.length

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-6">
      {/* Header */}
      <header className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Media Assets</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Media Library
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Cloudinary media management. Uploads and deletions sync across database and Cloudinary.
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

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer border ${
              activeTab === 'cloud'
                ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline'
            }`}
          >
            Cloudinary Uploads ({mediaItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer border ${
              activeTab === 'curated'
                ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline'
            }`}
          >
            Local Curated Pack ({NEPAL_PHOTOS.length})
          </button>
        </div>

        {activeTab === 'curated' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by photo title..."
              className="w-full pl-8 pr-3 py-1.5 min-h-[36px] text-xs bg-bg-elevated border border-hairline rounded-pill text-ink focus:outline-none focus:border-hairline-strong"
            />
          </div>
        )}
      </div>

      {/* ── CLOUDINARY TAB ─────────────────────────────────────────────── */}
      {activeTab === 'cloud' && (
        <>
          {/* Multi-select toolbar (only shown when media exists) */}
          {!loading && mediaItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Select All toggle */}
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
              >
                {allSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-accent-blue" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
              </button>

              {/* Select Unused */}
              <button
                type="button"
                onClick={handleSelectUnused}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-accent-blue" />
                <span>Select Unused</span>
              </button>

              {/* Bulk Delete — appears when items are selected */}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-pill border border-accent-red/30 bg-accent-red/10 text-xs font-semibold text-accent-red hover:bg-accent-red/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete {selectedIds.size} selected</span>
                </button>
              )}

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink cursor-pointer min-h-[36px] px-2"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="border border-dashed border-hairline rounded-2xl p-12 text-center text-ink-tertiary bg-bg-elevated/40 space-y-3">
              <ImageIcon className="w-8 h-8 mx-auto text-ink-tertiary" />
              <p className="font-semibold text-ink">No Cloudinary uploads yet.</p>
              <p className="text-xs text-ink-tertiary max-w-sm mx-auto">
                Use the &quot;Upload Image&quot; button above to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {mediaItems.map((item) => {
                const isSelected = selectedIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl overflow-hidden bg-bg-elevated shadow-xs group flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-accent-blue ring-2 ring-accent-blue/30'
                        : 'border-hairline hover:border-hairline-strong'
                    }`}
                  >
                    {/* Image with checkbox overlay */}
                    <div
                      className="aspect-video bg-hairline relative overflow-hidden cursor-pointer"
                      onClick={() => toggleSelect(item.id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.secure_url}
                        alt={item.alt_text || 'Media item'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Checkbox overlay */}
                      <div className={`absolute top-2 left-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                          isSelected
                            ? 'bg-accent-blue border-accent-blue'
                            : 'bg-white/80 border-white/60 backdrop-blur-sm'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      {/* Selected overlay tint */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-accent-blue/10 pointer-events-none" />
                      )}
                    </div>

                    <div className="p-3 text-[11px] text-ink-secondary space-y-2">
                      <div>
                        <p
                          className="font-semibold text-ink truncate"
                          title={item.alt_text || item.title || 'Untitled'}
                        >
                          {item.alt_text || item.title || 'Untitled Image'}
                        </p>
                        {item.format && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-bg text-ink-tertiary rounded-pill border border-hairline">
                            {item.format}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-hairline">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.secure_url, item.id)}
                          className="inline-flex items-center gap-1 text-ink-secondary hover:text-ink font-semibold transition-colors min-h-[36px] cursor-pointer"
                          title="Copy Secure URL"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-accent-blue" />
                              <span className="text-[10px]">Copy URL</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <a
                            href={item.secure_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-ink-tertiary hover:text-ink rounded-pill"
                            title="Open Full Image"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(item.id, item.title || item.alt_text || 'Image')}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-ink-tertiary hover:text-accent-red rounded-pill transition-colors cursor-pointer"
                            title="Delete from database and Cloudinary"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-accent-red" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── CURATED TAB ────────────────────────────────────────────────── */}
      {activeTab === 'curated' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredCurated.map((photo) => (
            <div
              key={photo.slug}
              className="border border-hairline rounded-xl overflow-hidden bg-bg-elevated shadow-xs group flex flex-col justify-between"
            >
              <div className="aspect-video bg-hairline relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <div className="p-3 text-[11px] text-ink-secondary space-y-2">
                <div>
                  <p className="font-semibold text-ink truncate" title={photo.title}>
                    {photo.title}
                  </p>
                  <span className="text-[10px] text-ink-tertiary">
                    {photo.optimizedSizeKb} KB • WebP High Res
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(photo.src, photo.slug)}
                    className="inline-flex items-center gap-1 text-ink-secondary hover:text-ink font-semibold transition-colors min-h-[36px] cursor-pointer"
                  >
                    {copiedId === photo.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-accent-blue" />
                        <span className="text-[11px]">Copy Path</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bulk Delete Confirmation Modal ─────────────────────────────── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-bg-elevated border border-hairline rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-accent-red/10 flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Delete {selectedIds.size} image{selectedIds.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  This will permanently remove {selectedIds.size} image{selectedIds.size !== 1 ? 's' : ''} from
                  both Cloudinary storage and the database. <strong className="text-ink">This cannot be undone.</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-pill bg-accent-red text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {bulkDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
