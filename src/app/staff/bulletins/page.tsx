'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  Upload,
  Loader2,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { BulletinRecord } from '@/types/database'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getWebImageUrl } from '@/lib/cloudinary/imageHelper'

export default function ManageBulletinsClientPage() {
  const [bulletins, setBulletins] = useState<BulletinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state for creating a new bulletin
  const [title, setTitle] = useState('')
  const [noticeText, setNoticeText] = useState('')
  const [pictureUrl, setPictureUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  )
  const [priority, setPriority] = useState<number>(15)
  const [isActive, setIsActive] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchBulletins = async () => {
    try {
      const res = await fetch('/api/bulletins')
      const data = await res.json()
      if (data.bulletins) {
        setBulletins(data.bulletins)
      }
    } catch (err) {
      console.warn('Failed to load bulletins:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBulletins()
  }, [])

  const occupiedSlots: Record<number, string> = {}
  bulletins.forEach((b) => {
    if (b.is_active && b.priority >= 1 && b.priority <= 15) {
      occupiedSlots[b.priority] = b.title
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `Bulletin - ${title || 'Notice'}`)
      formData.append('folder', 'nepalora/events')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      setPictureUrl(data.data.secure_url)
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Image upload failed' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateBulletin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)

    try {
      const res = await fetch('/api/bulletins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          notice: noticeText.trim(),
          picture_url: pictureUrl || null,
          link_url: linkUrl || null,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          priority,
          is_active: isActive,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create bulletin')
      }

      setNotice({ type: 'success', message: 'Bulletin published successfully!' })
      setIsModalOpen(false)

      // Reset form
      setTitle('')
      setNoticeText('')
      setPictureUrl('')
      setLinkUrl('')
      setPriority(15)

      fetchBulletins()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to create bulletin' })
    } finally {
      setSaving(false)
      setTimeout(() => setNotice(null), 5000)
    }
  }

  const handleDeleteBulletin = async (id: string, bTitle: string) => {
    if (!confirm(`Are you sure you want to delete bulletin "${bTitle}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/bulletins?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Delete failed')

      setNotice({ type: 'success', message: 'Bulletin deleted.' })
      fetchBulletins()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete bulletin' })
    } finally {
      setTimeout(() => setNotice(null), 4000)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/bulletins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Update failed')

      fetchBulletins()
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Status update failed' })
    }
  }

  const now = new Date()

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="red">Emergency & Trail Broadcast</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Bulletin System
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Top #1 priority is featured as the top site warning banner; other notices are published on the Homepage Noticeboard.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            let freeSlot = 15
            for (let i = 15; i >= 1; i--) {
              if (!occupiedSlots[i]) {
                freeSlot = i
                break
              }
            }
            setPriority(freeSlot)
            setIsModalOpen(true)
          }}
          className="flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Bulletin</span>
        </Button>
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

      {loading ? (
        <div className="py-12 flex justify-center text-ink-tertiary">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
      ) : (
        <>
          {/* Mobile Bulletin Cards */}
          <div className="block sm:hidden space-y-3">
            {bulletins.length === 0 ? (
              <div className="p-8 border border-dashed border-hairline rounded-2xl text-center text-ink-tertiary bg-bg-elevated space-y-2">
                <Bell className="w-6 h-6 mx-auto text-ink-tertiary" />
                <p className="font-semibold text-ink">No bulletins registered yet.</p>
              </div>
            ) : (
              bulletins.map((b, idx) => {
                const start = new Date(b.start_date)
                const end = new Date(b.end_date)
                const isLive = b.is_active && now >= start && now <= end
                const isTopWarning = idx === 0 && isLive

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-hairline bg-bg-elevated shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {isTopWarning ? (
                        <Badge tone="red">
                          <Sparkles className="w-2.5 h-2.5 mr-1" /> Top Banner
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Noticeboard</Badge>
                      )}
                      <span className="text-[10px] font-mono text-ink-tertiary">
                        Slot #{b.priority}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-sm text-ink leading-snug">
                        {b.title}
                      </h3>
                      <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{b.notice}</p>
                    </div>

                    <div className="pt-2 border-t border-hairline flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b.id, b.is_active)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${
                          isLive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-bg text-ink-tertiary'
                        }`}
                      >
                        {isLive ? 'Live Now' : b.is_active ? 'Scheduled' : 'Paused'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBulletin(b.id, b.title)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-accent-red"
                        title="Delete Bulletin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block border border-hairline rounded-2xl bg-bg-elevated overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg/80 border-b border-hairline text-ink-tertiary uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Title & Notice</th>
                    <th className="px-5 py-3.5">Connected Link</th>
                    <th className="px-5 py-3.5">Schedule</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {bulletins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-ink-tertiary space-y-2">
                        <Bell className="w-6 h-6 mx-auto text-ink-tertiary" />
                        <p className="font-semibold text-ink">No bulletins registered yet.</p>
                      </td>
                    </tr>
                  ) : (
                    bulletins.map((b, idx) => {
                      const start = new Date(b.start_date)
                      const end = new Date(b.end_date)
                      const isLive = b.is_active && now >= start && now <= end
                      const isTopWarning = idx === 0 && isLive

                      return (
                        <tr key={b.id} className="hover:bg-bg/50 transition-colors">
                          <td className="px-5 py-4">
                            {isTopWarning ? (
                              <Badge tone="red">
                                <Sparkles className="w-2.5 h-2.5 mr-1" /> Top Banner
                              </Badge>
                            ) : (
                              <Badge tone="neutral">Noticeboard</Badge>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <strong className="font-semibold text-ink block">{b.title}</strong>
                            <p className="text-[11px] text-ink-secondary line-clamp-1 max-w-sm">{b.notice}</p>
                          </td>

                          <td className="px-5 py-4">
                            {b.article ? (
                              <Link
                                href={`/article/${b.article.slug}`}
                                className="text-accent-blue hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>Guide: {b.article.slug}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : b.link_url ? (
                              <a
                                href={b.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-blue hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                <LinkIcon className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{b.link_url}</span>
                              </a>
                            ) : (
                              <span className="text-ink-tertiary text-[11px]">No link</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-ink-secondary text-[11px]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-ink-tertiary" />
                              <span>{start.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-ink-tertiary">
                              <Clock className="w-3 h-3" />
                              <span>until {end.toLocaleDateString()}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(b.id, b.is_active)}
                              className="cursor-pointer"
                            >
                              {isLive ? (
                                <Badge tone="red">Live Now</Badge>
                              ) : b.is_active ? (
                                <Badge tone="blue">Scheduled</Badge>
                              ) : (
                                <Badge tone="neutral">Paused</Badge>
                              )}
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteBulletin(b.id, b.title)}
                              className="p-1.5 rounded-lg border border-accent-red/20 text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                              title="Delete Bulletin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Modal Dialog for New Bulletin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-bg-elevated rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-hairline relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent-red" />
                Create New Bulletin Notice
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-tertiary hover:text-ink rounded-pill"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBulletin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annapurna High Pass Weather Advisory"
                  className="w-full p-3 min-h-[44px] border border-hairline rounded-xl text-ink bg-bg focus:border-hairline-strong focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Notice Description *</label>
                <textarea
                  rows={3}
                  required
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Clear brief advisory text..."
                  className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg focus:border-hairline-strong focus:outline-none leading-relaxed"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Optional Picture / Icon
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="bulletin-pic"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="bulletin-pic"
                    className="cursor-pointer py-2 px-3 bg-bg border border-hairline hover:border-hairline-strong text-ink font-semibold rounded-pill flex items-center gap-1.5 min-h-[40px]"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-accent-blue" />
                    )}
                    <span>{uploadingImage ? 'Compressing...' : 'Upload Image'}</span>
                  </label>
                  {pictureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getWebImageUrl(pictureUrl, 'thumb')} alt="" className="w-8 h-8 rounded object-cover border border-hairline" />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Optional Target Link URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... or /article/your-slug"
                  className="w-full p-3 min-h-[44px] border border-hairline rounded-xl text-ink bg-bg font-mono text-[11px] focus:border-hairline-strong focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 min-h-[44px] border border-hairline rounded-xl text-ink bg-bg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 min-h-[44px] border border-hairline rounded-xl text-ink bg-bg"
                  />
                </div>
              </div>

              {/* Priority Ranking Slider */}
              <div className="border border-hairline rounded-xl p-4 bg-bg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-ink text-xs">
                    Priority Rank
                  </label>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-pill ${
                    priority === 1
                      ? 'bg-accent-red/10 text-accent-red border border-accent-red/30'
                      : priority <= 3
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-bg-elevated border border-hairline text-ink-secondary'
                  }`}>
                    {priority === 1 ? '⚡ Top Banner (Slot #1)' : `Noticeboard Slot #${priority}`}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer accent-accent-blue"
                  style={{ accentColor: priority === 1 ? 'var(--accent-red)' : 'var(--accent-blue)' }}
                />

                <div className="flex justify-between text-[10px] text-ink-tertiary font-mono">
                  <span className="text-accent-red font-semibold">1 — Top Banner</span>
                  <span>15 — Last</span>
                </div>

                {occupiedSlots[priority] && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    Slot #{priority} is occupied by &ldquo;{occupiedSlots[priority]}&rdquo;. It will be overridden when you create this bulletin.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is-active-bulletin"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="is-active-bulletin" className="font-semibold text-ink cursor-pointer">
                  Active & Visible on Site
                </label>
              </div>

              <div className="border-t border-hairline pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Creating...' : 'Create & Publish'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
