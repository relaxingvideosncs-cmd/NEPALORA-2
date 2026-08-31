'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GalleryCategoryRecord } from '@/types/database'

export default function ManageCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'articles'>('gallery')
  const [categories, setCategories] = useState<GalleryCategoryRecord[]>([])
  const [articleCategories, setArticleCategories] = useState<any[]>([])
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<GalleryCategoryRecord | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formOrder, setFormOrder] = useState<number>(1)
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    try {
      // 1. Fetch gallery categories
      const catRes = await fetch('/api/gallery-categories')
      const catData = await catRes.json()
      if (catData.categories) {
        setCategories(catData.categories)
      }

      // 2. Fetch all gallery photos to compute category counts
      const photoRes = await fetch('/api/galleries?mode=all_published')
      const photoData = await photoRes.json()
      if (photoData.items) {
        const counts: Record<string, number> = {}
        photoData.items.forEach((p: any) => {
          const cat = p.category || 'Mountains & Landscapes'
          counts[cat] = (counts[cat] || 0) + 1
        })
        setPhotoCounts(counts)
      }

      // 3. Fetch article categories for the article tab
      const artRes = await fetch('/api/articles')
      const artData = await artRes.json()
      if (artData.articles) {
        const uniqueCats: Record<string, { name: string; slug: string; count: number }> = {}
        artData.articles.forEach((a: any) => {
          const name = a.category?.name || 'General'
          const slug = a.category?.slug || 'general'
          if (!uniqueCats[name]) {
            uniqueCats[name] = { name, slug, count: 0 }
          }
          uniqueCats[name].count += 1
        })
        setArticleCategories(Object.values(uniqueCats))
      }
    } catch (err) {
      console.warn('Could not load categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenAddModal = () => {
    setEditingCategory(null)
    setFormName('')
    setFormSlug('')
    setFormDesc('')
    setFormOrder(categories.length + 1)
    setFormActive(true)
    setModalOpen(true)
  }

  const handleOpenEditModal = (cat: GalleryCategoryRecord) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormSlug(cat.slug)
    setFormDesc(cat.description || '')
    setFormOrder(cat.display_order)
    setFormActive(cat.is_active)
    setModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDesc.trim() || null,
        display_order: Number(formOrder) || 1,
        is_active: formActive,
      }

      let res
      if (editingCategory) {
        res = await fetch('/api/gallery-categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...payload }),
        })
      } else {
        res = await fetch('/api/gallery-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Save failed')

      setNotice({
        type: 'success',
        message: `Category "${formName}" ${editingCategory ? 'updated' : 'created'} successfully!`,
      })
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to save category' })
    } finally {
      setSaving(false)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  const handleToggleActive = async (cat: GalleryCategoryRecord) => {
    try {
      const newActive = !cat.is_active
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: newActive } : c))
      )

      const res = await fetch('/api/gallery-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, slug: cat.slug, is_active: newActive }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update status')

      setNotice({
        type: 'success',
        message: `Category "${cat.name}" is now ${newActive ? 'Active' : 'Disabled'}.`,
      })
    } catch (err: any) {
      fetchData()
      setNotice({ type: 'error', message: err.message || 'Failed to update category status' })
    } finally {
      setTimeout(() => setNotice(null), 4000)
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[targetIndex]
    newCategories[targetIndex] = temp

    // Update display orders
    const reordered = newCategories.map((cat, idx) => ({
      id: cat.id,
      slug: cat.slug,
      display_order: idx + 1,
    }))

    setCategories(
      newCategories.map((cat, idx) => ({
        ...cat,
        display_order: idx + 1,
      }))
    )

    try {
      await fetch('/api/gallery-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: reordered }),
      })
    } catch (err) {
      console.warn('Reorder failed:', err)
      fetchData()
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setDeleting(true)
    try {
      const target = categories.find((c) => c.id === id)
      const queryParams = new URLSearchParams()
      if (id) queryParams.set('id', id)
      if (target?.slug) queryParams.set('slug', target.slug)

      const res = await fetch(`/api/gallery-categories?${queryParams.toString()}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Delete failed')

      setNotice({ type: 'success', message: 'Category deleted successfully.' })
      setDeleteConfirmId(null)
      fetchData()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete category' })
    } finally {
      setDeleting(false)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  return (
    <div className="space-y-6 py-2 sm:py-4 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="red">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Taxonomy & Categorization
            </Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Category Manager
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Manage subject categories for all photography collections and editorial article pillars.
          </p>
        </div>

        {activeTab === 'gallery' && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            className="self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo Category</span>
          </Button>
        )}
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

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-bg-elevated border border-hairline p-1 rounded-pill text-xs font-semibold self-start overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gallery Photo Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
            activeTab === 'articles'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Article Content Pillars ({articleCategories.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-ink-tertiary">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          <span className="text-xs font-medium">Loading categories...</span>
        </div>
      ) : activeTab === 'gallery' ? (
        /* ========================================================= */
        /* TAB 1: GALLERY PHOTO CATEGORIES (ACTIVE CRUD)             */
        /* ========================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-secondary">
              These categories appear in the public <span className="font-semibold text-ink">/gallery</span> filter bar and the gallery photo uploader dropdown.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, index) => {
              const count = photoCounts[cat.name] || 0
              return (
                <div
                  key={cat.id}
                  className={`
                    border rounded-2xl p-4 bg-bg-elevated shadow-xs flex flex-col justify-between space-y-3 transition-all
                    ${cat.is_active ? 'border-hairline hover:border-hairline-strong' : 'border-hairline opacity-60 bg-bg'}
                  `}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] px-2.5 py-0.5 bg-bg rounded-pill border border-hairline text-ink font-semibold">
                        /{cat.slug}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                          {count} photo{count !== 1 ? 's' : ''}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ring-2 ring-black/30 ${
                            cat.is_active ? 'bg-emerald-400' : 'bg-neutral-400'
                          }`}
                          title={cat.is_active ? 'Active' : 'Disabled'}
                        />
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-base text-ink leading-snug">
                      {cat.name}
                    </h3>

                    {cat.description && (
                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2 text-xs">
                    {/* Reorder Arrows */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, 'up')}
                        aria-label="Move category up"
                        className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline disabled:opacity-20 transition-all cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-ink" />
                      </button>
                      <button
                        type="button"
                        disabled={index === categories.length - 1}
                        onClick={() => handleMoveOrder(index, 'down')}
                        aria-label="Move category down"
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
                        onClick={() => handleToggleActive(cat)}
                        aria-label={cat.is_active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline text-ink transition-all cursor-pointer"
                        title={cat.is_active ? 'Click to disable' : 'Click to enable'}
                      >
                        {cat.is_active ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-ink-tertiary" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cat)}
                        aria-label="Edit category"
                        className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline text-ink transition-all cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-accent-blue" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(cat.id)}
                        aria-label="Delete category"
                        className="p-1.5 rounded-lg bg-bg hover:bg-bg-elevated border border-hairline text-accent-red transition-all cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* TAB 2: ARTICLE EDITORIAL PILLARS                          */
        /* ========================================================= */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articleCategories.map((cat) => (
              <div
                key={cat.name}
                className="border border-hairline rounded-2xl p-5 bg-bg-elevated shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2.5 py-0.5 bg-bg rounded-pill border border-hairline text-ink font-semibold">
                    /{cat.slug}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-accent-blue/10 text-accent-blue">
                    {cat.count} articles
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-ink">{cat.name}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Canonical editorial guide repository for {cat.name.toLowerCase()} in Nepal.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-bg-elevated rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-hairline relative">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-blue" />
                {editingCategory ? 'Edit Photo Category' : 'Create New Photo Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-bg text-ink-tertiary hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Food & Culinary, Wildlife & Nature"
                  className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg focus:border-hairline-strong focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">URL Slug (Optional)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg font-mono text-[11px] focus:border-hairline-strong focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief description of what photos belong in this category..."
                  className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg focus:border-hairline-strong focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-accent-blue focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-ink">Active / Publicly Visible</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-bg-elevated rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-hairline text-xs">
            <h3 className="font-display text-base font-bold text-ink">Delete Category?</h3>
            <p className="text-ink-secondary leading-relaxed">
              Are you sure you want to delete this category? Photos assigned to this category will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 rounded-pill bg-accent-red text-white font-semibold hover:bg-accent-red/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
