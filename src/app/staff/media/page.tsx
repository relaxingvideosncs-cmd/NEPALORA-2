'use client'

import React, { useState, useEffect } from 'react'
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Search,
  Trash2,
} from 'lucide-react'
import { MediaRecord } from '@/types/database'
import { compressImageClient } from '@/lib/cloudinary/clientCompress'
import { Badge } from '@/components/ui/Badge'
import { NEPAL_PHOTOS, NepalPhoto } from '@/lib/data/nepalImages'

export default function MediaLibraryClientPage() {
  const [activeTab, setActiveTab] = useState<'cloud' | 'curated'>('cloud')
  const [searchFilter, setSearchFilter] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchMedia = async () => {
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
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUploadFromGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setNotice(null)

    try {
      // 1. Auto-compress client side
      const compressed = await compressImageClient(file)

      // 2. Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''))

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upload failed')
      }

      setNotice({
        type: 'success',
        message: `Image "${file.name}" compressed and uploaded to Cloudinary successfully!`,
      })
      setActiveTab('cloud')
      fetchMedia()
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Image upload failed',
      })
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

  const handleDeleteMedia = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" from Supabase database and Cloudinary storage?`)) {
      return
    }

    try {
      const res = await fetch(`/api/upload?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Deletion failed')

      setNotice({ type: 'success', message: `Deleted "${name}" from database and Cloudinary.` })
      setMediaItems((prev) => prev.filter((m) => m.id !== id))
      setTimeout(() => setNotice(null), 4000)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete image' })
    }
  }

  const filteredCurated = NEPAL_PHOTOS.filter((p) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.caption?.toLowerCase().includes(q)
  })

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
            className="cursor-pointer py-2.5 px-4 bg-ink hover:bg-ink/90 text-bg text-xs font-semibold rounded-pill inline-flex items-center gap-2 shadow-xs transition-colors active:scale-95 select-none"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-bg" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Upload to Cloudinary</span>
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
          <span>{notice.message}</span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-ink text-bg shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline'
            }`}
          >
            Cloudinary Uploads ({mediaItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'curated'
                ? 'bg-ink text-bg shadow-2xs'
                : 'bg-bg-elevated text-ink-secondary hover:text-ink border border-hairline'
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
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg-elevated border border-hairline rounded-pill text-ink"
            />
          </div>
        )}
      </div>

      {/* CURATED LOCAL PACK TAB */}
      {activeTab === 'curated' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
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
                    className="inline-flex items-center gap-1 text-ink-secondary hover:text-ink font-semibold transition-colors min-h-[36px]"
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

      {/* CLOUDINARY TAB */}
      {activeTab === 'cloud' && (
        <>
          {loading ? (
            <div className="py-16 flex justify-center text-ink-tertiary">
              <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="border border-dashed border-hairline rounded-2xl p-12 text-center text-ink-tertiary bg-bg-elevated/40 space-y-3">
              <ImageIcon className="w-8 h-8 mx-auto text-ink-tertiary" />
              <p className="font-semibold text-ink">No Cloudinary uploads yet.</p>
              <p className="text-xs text-ink-tertiary max-w-sm mx-auto">
                Use the &quot;Upload to Cloudinary&quot; button above. Images will be automatically compressed before uploading.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-hairline rounded-xl overflow-hidden bg-bg-elevated shadow-xs group flex flex-col justify-between"
                >
                  <div className="aspect-video bg-hairline relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.secure_url}
                      alt={item.alt_text || 'Media item'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
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
                        className="inline-flex items-center gap-1 text-ink-secondary hover:text-ink font-semibold transition-colors min-h-[36px]"
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
