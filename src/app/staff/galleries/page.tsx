'use client'

import React, { useState, useEffect } from 'react'
import {
  Images,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Eye,
  EyeOff,
  Sliders,
  X,
  Heart,
  Square,
  CheckSquare,
  AlertCircle,
  Check,
} from 'lucide-react'
import { GalleryPhotoRecord, GallerySlot } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'
import { getWebImageUrl } from '@/lib/cloudinary/imageHelper'

const FIVE_GALLERIES_CONFIG: {
  id: GallerySlot
  name: string
  desc: string
  badgeTone: 'blue' | 'red' | 'neutral'
}[] = [
  {
    id: 'hero',
    name: 'Hero Slideshow',
    desc: 'Landing page full-screen edge-to-edge photography slideshow',
    badgeTone: 'blue',
  },
  {
    id: 'home_grid',
    name: 'Homepage Grid (2x3)',
    desc: 'Interactive 2x3 photo grid showcase on homepage',
    badgeTone: 'red',
  },
  {
    id: 'prepare_polaroid',
    name: 'Preparation Polaroid',
    desc: 'Preparation for Nepal infinite white Polaroid slider',
    badgeTone: 'blue',
  },
  {
    id: 'trekking_polaroid',
    name: 'Trekking Polaroid',
    desc: 'Trekking & Adventure infinite white Polaroid slider',
    badgeTone: 'blue',
  },
  {
    id: 'recovery_polaroid',
    name: 'Recovery Polaroid',
    desc: 'Recovery & Healing infinite white Polaroid slider',
    badgeTone: 'red',
  },
]

async function safeParseResponse(res: Response) {
  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Server returned invalid response: ${text.slice(0, 100)}`)
  }
}

export default function StaffGalleryControllerPage() {
  const [activeSlot, setActiveSlot] = useState<GallerySlot>('hero')
  const [items, setItems] = useState<GalleryPhotoRecord[]>([])
  const [categories, setCategories] = useState<string[]>([
    'Mountains & Landscapes',
    'Culture & Heritage',
    'Food & Culinary',
    'People & Daily Life',
    'Monasteries & Sacred Sites',
    'Festivals & Celebrations',
    'Wildlife & Nature',
    'Trekking & Adventure',
  ])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Multi-select state for bulk deletion
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Fetch categories from API
  useEffect(() => {
    fetch('/api/gallery-categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories.map((c: any) => c.name))
        }
      })
      .catch(() => {})
  }, [])

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<GalleryPhotoRecord> | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Load items for active slot
  const loadItems = async (slot: GallerySlot) => {
    setLoading(true)
    setSelectedIds(new Set()) // Clear selection when switching slots
    try {
      const res = await fetch(`/api/galleries?slot=${slot}`)
      const data = await safeParseResponse(res)
      if (data.items) {
        setItems(data.items)
      } else {
        setItems([])
      }
    } catch (err: any) {
      console.warn('Failed to load gallery photos:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems(activeSlot)
  }, [activeSlot])

  // Upload image to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('title', editingItem?.title || file.name.replace(/\.[^/.]+$/, ''))
      uploadForm.append('caption', editingItem?.description || '')
      uploadForm.append('alt_text', editingItem?.seo_alt || editingItem?.title || '')
      uploadForm.append('folder', 'nepalora/gallery')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm,
      })

      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Cloudinary upload failed')

      setEditingItem((prev) => ({
        ...prev,
        image_url: data.data.secure_url,
      }))
      setNotice({ type: 'success', message: 'Uploaded to Cloudinary successfully!' })
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Image upload failed' })
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // Save Add / Edit
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem?.title || !editingItem?.image_url) {
      setNotice({ type: 'error', message: 'Short title and Cloudinary image link are required.' })
      return
    }

    setSaving(true)
    setNotice(null)

    try {
      const isNew = !editingItem.id
      const method = isNew ? 'POST' : 'PUT'

      const payload = {
        ...editingItem,
        gallery_slot: activeSlot,
        seo_alt: editingItem.seo_alt || editingItem.title,
        display_order: editingItem.display_order ?? items.length,
        is_active: editingItem.is_active ?? true,
      }

      const res = await fetch('/api/galleries', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save photograph')

      setNotice({ type: 'success', message: 'Photograph saved to Cloudinary gallery successfully!' })
      setModalOpen(false)
      setEditingItem(null)
      loadItems(activeSlot)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Save failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  // Toggle Active/Inactive
  const handleToggleActive = async (item: GalleryPhotoRecord) => {
    const nextState = !item.is_active
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_active: nextState } : it)))

    try {
      const res = await fetch('/api/galleries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: nextState }),
      })
      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to toggle status')
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Toggle failed' })
      loadItems(activeSlot)
    }
  }

  // Move Up / Move Down Reordering
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp

    const reorderPayload = newItems.map((item, idx) => ({
      id: item.id,
      display_order: idx,
    }))

    setItems(newItems)

    try {
      const res = await fetch('/api/galleries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: reorderPayload }),
      })
      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Reorder failed')
      setNotice({ type: 'success', message: 'Gallery sequence updated!' })
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Reorder failed' })
      loadItems(activeSlot)
    }
  }

  // Delete item from Database and Cloudinary
  const handleDeleteItem = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}" from the database and Cloudinary storage?`)) return

    try {
      const res = await fetch(`/api/galleries?id=${id}`, { method: 'DELETE' })
      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Delete failed')

      setNotice({ type: 'success', message: `Deleted "${title}" from database and Cloudinary.` })
      setItems((prev) => prev.filter((it) => it.id !== id))
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
      setTimeout(() => setNotice(null), 4000)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Delete failed' })
    }
  }

  // Bulk delete selected gallery photos
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    setNotice(null)

    const ids = Array.from(selectedIds)
    let deletedCount = 0
    const errors: string[] = []

    for (const id of ids) {
      try {
        const res = await fetch(`/api/galleries?id=${id}`, { method: 'DELETE' })
        const data = await safeParseResponse(res)
        if (!res.ok || data.error) throw new Error(data.error || 'Delete failed')
        deletedCount++
      } catch (err: any) {
        errors.push(err.message)
      }
    }

    setItems((prev) => prev.filter((it) => !selectedIds.has(it.id)))
    setSelectedIds(new Set())
    setBulkDeleteConfirm(false)
    setBulkDeleting(false)

    if (errors.length === 0) {
      setNotice({ type: 'success', message: `Deleted ${deletedCount} photograph(s) successfully.` })
    } else {
      setNotice({ type: 'error', message: `Deleted ${deletedCount}, failed ${errors.length}. ${errors[0]}` })
    }
    setTimeout(() => setNotice(null), 6000)
  }

  // Toggle selection of single item
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeSlotConfig = FIVE_GALLERIES_CONFIG.find((s) => s.id === activeSlot)!

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-6 max-w-6xl">
      {/* Top Header */}
      <div className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="red">
              <Sliders className="w-3.5 h-3.5 mr-1" />
              5-Gallery Cloud Controller
            </Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Master Gallery Controller
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Manage all 5 galleries from scratch. Full control over Cloudinary images, titles, descriptions, locations, SEO, and like counts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setEditingItem({
                gallery_slot: activeSlot,
                title: '',
                description: '',
                location: '',
                seo_alt: '',
                seo_keywords: [],
                image_url: '',
                like_count: 0,
                display_order: items.length,
                is_active: true,
              })
              setModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Upload Photograph</span>
          </Button>
        </div>
      </div>

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

      {/* 5 Gallery Slots Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-1.5 bg-bg-elevated border border-hairline rounded-2xl shadow-2xs">
        {FIVE_GALLERIES_CONFIG.map((slot) => {
          const isActive = activeSlot === slot.id
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActiveSlot(slot.id)}
              className={`
                flex flex-col items-start p-3 rounded-xl text-left transition-all cursor-pointer min-h-[64px] justify-between border
                ${
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-2xs font-bold'
                    : 'bg-transparent text-ink-secondary hover:text-ink hover:bg-bg border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="truncate">{slot.name}</span>
              </div>
              <span className={`text-[10px] ${isActive ? 'text-accent-blue/70' : 'text-ink-tertiary'}`}>
                Slot: {slot.id}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active Gallery Information Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-bg-elevated border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-ink">
              {activeSlotConfig.name}
            </h2>
            <Badge tone={activeSlotConfig.badgeTone}>{items.length} Photographs</Badge>
          </div>
          <p className="text-xs text-ink-secondary mt-1 max-w-2xl">{activeSlotConfig.desc}</p>
        </div>

        <div className="text-xs text-ink-tertiary font-mono bg-bg px-3 py-1.5 rounded-lg border border-hairline self-start sm:self-auto">
          Slot ID: {activeSlot}
        </div>
      </div>

      {/* Photo Cards List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-ink-tertiary">
          <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
          <p className="text-xs">Loading {activeSlotConfig.name} photographs from Cloudinary...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-hairline-strong rounded-2xl bg-bg-elevated space-y-3">
          <Images className="w-8 h-8 mx-auto text-ink-tertiary" />
          <h3 className="font-display font-bold text-base text-ink">No Photographs in this Gallery</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto">
            This gallery is completely empty. Upload your first photograph to Cloudinary below.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingItem({
                gallery_slot: activeSlot,
                title: '',
                description: '',
                location: '',
                seo_alt: '',
                seo_keywords: [],
                image_url: '',
                like_count: 0,
                display_order: 0,
                is_active: true,
              })
              setModalOpen(true)
            }}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Upload First Photograph</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Multi-select toolbar */}
          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.size === items.length) setSelectedIds(new Set())
                  else setSelectedIds(new Set(items.map((it) => it.id)))
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
              >
                {selectedIds.size === items.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-accent-blue" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>{selectedIds.size === items.length ? 'Deselect All' : 'Select All in Slot'}</span>
              </button>

              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-pill border border-accent-red/30 bg-accent-red/10 text-xs font-semibold text-accent-red hover:bg-accent-red/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {selectedIds.size} selected</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink cursor-pointer min-h-[36px] px-2"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                </>
              )}
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-xs font-semibold text-ink-tertiary flex items-center gap-1 flex-shrink-0 mr-1">
              Category:
            </span>
            {['all', ...categories].map((cat) => {
              const isSelected = selectedCategoryFilter === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-pill text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-2xs font-bold'
                      : 'bg-bg-elevated text-ink-secondary hover:text-ink border-hairline hover:border-hairline-strong'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {items
            .filter((it) => selectedCategoryFilter === 'all' || (it.category || 'Mountains & Landscapes') === selectedCategoryFilter)
            .map((item, index) => {
            const isSelected = selectedIds.has(item.id)
            return (
            <div
              key={item.id}
              className={`
                rounded-2xl border bg-bg-elevated overflow-hidden flex flex-col justify-between shadow-xs transition-all group
                ${isSelected ? 'border-accent-blue ring-2 ring-accent-blue/30' : item.is_active ? 'border-hairline hover:border-hairline-strong' : 'border-hairline opacity-65 bg-bg'}
              `}
            >
              {/* Photo Canvas Preview (Generous 4:3 Aspect Ratio for Large Clear Image Viewing) */}
              <div
                className="relative aspect-[4/3] bg-neutral-900/10 overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={() => toggleSelect(item.id)}
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getWebImageUrl(item.image_url, 'card')}
                    alt={item.seo_alt || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <Images className="w-8 h-8 text-ink-tertiary" />
                )}

                {/* Checkbox overlay */}
                <div className={`absolute top-2.5 left-2.5 z-20 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isSelected ? 'bg-accent-blue border-accent-blue text-white shadow-xs' : 'bg-black/60 border-white/40 text-transparent backdrop-blur-xs'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>

                {/* Index Pill */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs z-10 font-mono">
                  #{index + 1}
                </div>

                {/* Like Count Pill */}
                <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-pill text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs z-10 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>{item.like_count || 0}</span>
                </div>

                {/* Status Badge */}
                <div className="absolute bottom-2 right-2.5 z-10">
                  <span className={`px-2 py-0.5 rounded-pill text-[10px] font-bold text-white shadow-xs backdrop-blur-xs ${item.is_active ? 'bg-emerald-600/90' : 'bg-neutral-700/90'}`}>
                    {item.is_active ? 'Live' : 'Inactive'}
                  </span>
                </div>

                {/* Selected overlay tint */}
                {isSelected && <div className="absolute inset-0 bg-accent-blue/15 pointer-events-none" />}
              </div>

              {/* Photo Information & Controls */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-bg rounded-pill border border-hairline text-ink truncate max-w-[140px]">
                      {item.category || 'Mountains & Landscapes'}
                    </span>
                    {item.location && (
                      <div className="flex items-center gap-1 text-[10px] text-ink-tertiary truncate">
                        <MapPin className="w-2.5 h-2.5 text-accent-red flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-xs text-ink truncate" title={item.title}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-[11px] text-ink-secondary line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-hairline flex items-center justify-between gap-1">
                  {/* Reorder Arrows */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      aria-label="Move up"
                      className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline disabled:opacity-20 transition-all cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-ink" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      aria-label="Move down"
                      className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline disabled:opacity-20 transition-all cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-ink" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      aria-label={item.is_active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline text-ink transition-all cursor-pointer"
                      title={item.is_active ? 'Click to deactivate' : 'Click to publish'}
                    >
                      {item.is_active ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-ink-tertiary" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item)
                        setModalOpen(true)
                      }}
                      aria-label="Edit"
                      className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline text-ink transition-all cursor-pointer"
                      title="Edit photo details"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-accent-blue" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      aria-label="Delete"
                      className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline text-accent-red transition-all cursor-pointer"
                      title="Delete photo"
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
        </>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-bg-elevated border border-hairline rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-accent-red/10 flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Delete {selectedIds.size} photograph{selectedIds.size !== 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  This will permanently remove {selectedIds.size} photograph{selectedIds.size !== 1 ? 's' : ''} from
                  Cloudinary storage and the database. <strong className="text-ink">This cannot be undone.</strong>
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

      {/* Add / Edit Photograph Modal */}
      {modalOpen && editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
        >
          <div className="relative max-w-lg w-full bg-bg-elevated border border-hairline rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-ink">
                  {editingItem.id ? 'Edit Photograph' : `Add Photo to ${activeSlotConfig.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setEditingItem(null)
                }}
                className="p-1 rounded-lg hover:bg-bg text-ink-tertiary hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Image Upload / URL */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Cloudinary Image Link *
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-bg border border-dashed border-hairline-strong flex items-center justify-center overflow-hidden flex-shrink-0">
                    {editingItem.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getWebImageUrl(editingItem.image_url)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Images className="w-6 h-6 text-ink-tertiary" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="upload-gallery-photo"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-gallery-photo"
                      className="cursor-pointer py-2 px-3 bg-bg hover:border-hairline-strong border border-hairline text-ink text-xs font-semibold rounded-pill inline-flex items-center gap-1.5 transition-colors"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-accent-blue" />
                      )}
                      <span>Upload & Compress Image</span>
                    </label>
                    <input
                      type="url"
                      value={editingItem.image_url || ''}
                      onChange={(e) =>
                        setEditingItem((prev) => ({ ...prev, image_url: e.target.value }))
                      }
                      placeholder="Paste Cloudinary secure_url"
                      required
                      className="w-full p-2 text-xs bg-bg border border-hairline rounded-lg font-mono text-ink"
                    />
                  </div>
                </div>
              </div>

              {/* Short Title */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Image Short Title *
                </label>
                <input
                  type="text"
                  value={editingItem.title || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Poon Hill Sunrise, Ancient Gumba"
                  required
                  className="w-full p-2.5 text-xs bg-bg border border-hairline rounded-xl text-ink"
                />
              </div>

              {/* Photo Subject Category */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Photo Subject Category *
                </label>
                <select
                  value={editingItem.category || 'Mountains & Landscapes'}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full p-2.5 text-xs bg-bg border border-hairline rounded-xl text-ink cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Caption / Handwritten text */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description / Handwritten Note
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Short caption or handwritten polaroid note"
                  className="w-full p-2.5 text-xs bg-bg border border-hairline rounded-xl text-ink"
                />
              </div>

              {/* Location Tag */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editingItem.location || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. Annapurna Base Camp, Upper Mustang"
                  className="w-full p-2.5 text-xs bg-bg border border-hairline rounded-xl text-ink"
                />
              </div>

              {/* SEO Alt Text & SEO Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    SEO Alt Text
                  </label>
                  <input
                    type="text"
                    value={editingItem.seo_alt || ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({ ...prev, seo_alt: e.target.value }))
                    }
                    placeholder="Descriptive image alt text"
                    className="w-full p-2 text-xs bg-bg border border-hairline rounded-xl text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={editingItem.display_order ?? 0}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        display_order: Number(e.target.value),
                      }))
                    }
                    className="w-full p-2 text-xs bg-bg border border-hairline rounded-xl text-ink"
                  />
                </div>
              </div>

              {/* Like Count & Status */}
              <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-hairline">
                <div>
                  <span className="font-semibold text-xs text-ink block">Publish to Live Gallery</span>
                  <span className="text-[10px] text-ink-tertiary">
                    When enabled, this photograph is immediately visible on the website.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingItem.is_active ?? true}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="w-4 h-4 accent-accent-blue cursor-pointer"
                />
              </div>

              {/* Submit Bar */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setModalOpen(false)
                    setEditingItem(null)
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="primary" size="md" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-accent-blue" /> : null}
                  <span>{saving ? 'Saving...' : 'Save Photograph'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
