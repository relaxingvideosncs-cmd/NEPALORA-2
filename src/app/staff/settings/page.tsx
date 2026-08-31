'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Share2,
  Search,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Loader2,
  Image as ImageIcon,
  Building,
  Trash2,
  Check,
} from 'lucide-react'
import { SiteSettingsRecord } from '@/types/database'
import { compressImageClient } from '@/lib/cloudinary/clientCompress'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

async function safeParseResponse(res: Response) {
  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Server returned invalid response (${res.status}): ${text.slice(0, 120)}`)
  }
}

export default function SiteSettingsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveNotice, setSaveNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<SiteSettingsRecord>>({
    brand_name: 'Soul of Nepal',
    tagline: 'Independent Nepal Travel, Trekking & Wellness Knowledge Base',
    description: 'A JSON-first Nepal travel, trekking, adventure, recovery and wellness information platform.',
    logo_url: '',
    full_logo_url: '',
    favicon_url: '',
    og_image_url: '',
    legal_business_name: 'Soul of Nepal Knowledge Platform',
    business_type: 'Editorial & Publishing',
    founded_year: 2026,
    email: 'editorial@soulofnepal.com',
    support_email: 'support@soulofnepal.com',
    phone: '',
    whatsapp: '',
    country: 'Nepal',
    province: 'Bagmati Province',
    district: 'Kathmandu',
    city: 'Kathmandu',
    address: 'Thamel, Kathmandu',
    postal_code: '44600',
    website_url: 'https://soulofnepal.com',
    facebook_url: '',
    instagram_url: 'https://instagram.com/soulofnepal',
    youtube_url: 'https://youtube.com/@soulofnepal',
    tiktok_url: '',
    linkedin_url: '',
    x_url: '',
    seo_title: 'Soul of Nepal — Travel, Himalayan Trekking & Wellness Platform',
    seo_description:
      'Comprehensive independent Nepal travel guides, Himalayan trekking routes, visa checklists, and post-trek holistic wellness sanctuaries.',
    seo_keywords: [
      'nepal travel',
      'himalayan trekking',
      'everest base camp',
      'annapurna circuit',
      'nepal visa',
      'yoga retreats nepal',
    ],
    google_site_verification: '',
    privacy_policy_url: '/about#privacy',
    terms_url: '/about#terms',
    disclaimer_url: '/about#disclaimer',
    is_active: true,
  })

  const [keywordsText, setKeywordsText] = useState('')

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        const data = await safeParseResponse(res)
        if (data.settings) {
          setFormData(data.settings)
          if (Array.isArray(data.settings.seo_keywords)) {
            setKeywordsText(data.settings.seo_keywords.join(', '))
          }
        }
      } catch (err) {
        console.warn('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle uploading and automatically updating the setting in DB
  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'logo_url' | 'full_logo_url' | 'favicon_url' | 'og_image_url'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingField(fieldName)
    setSaveNotice(null)

    try {
      const compressed = await compressImageClient(file, {
        maxDimension: fieldName === 'favicon_url' ? 256 : 1600,
        quality: 0.88,
      })

      const uploadForm = new FormData()
      uploadForm.append('file', compressed)
      uploadForm.append('title', `Brand Asset - ${fieldName}`)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm,
      })

      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      const newUrl = data.data.secure_url
      const updatedForm = { ...formData, [fieldName]: newUrl }
      setFormData(updatedForm)

      // Automatically persist to DB
      const saveRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedForm),
      })
      const saveData = await safeParseResponse(saveRes)
      if (!saveRes.ok || saveData.error) {
        throw new Error(saveData.error || 'Failed to update settings database')
      }

      if (saveData.settings) {
        setFormData(saveData.settings)
      }

      setSaveNotice({
        type: 'success',
        message: `Asset uploaded and saved to ${fieldName} successfully!`,
      })
    } catch (err: any) {
      setSaveNotice({
        type: 'error',
        message: err.message || 'Failed to upload asset',
      })
    } finally {
      setUploadingField(null)
      // Reset input value so the same file can be chosen again if needed
      e.target.value = ''
    }
  }

  // Handle 1-tap removing an image asset
  const handleRemoveAsset = async (
    fieldName: 'logo_url' | 'full_logo_url' | 'favicon_url' | 'og_image_url'
  ) => {
    setSaveNotice(null)
    const updatedForm = { ...formData, [fieldName]: '' }
    setFormData(updatedForm)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedForm),
      })
      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to clear asset')

      if (data.settings) {
        setFormData(data.settings)
      }

      setSaveNotice({
        type: 'success',
        message: `Asset cleared and removed from ${fieldName} successfully!`,
      })
    } catch (err: any) {
      setSaveNotice({
        type: 'error',
        message: err.message || 'Failed to clear asset',
      })
    }
  }

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveNotice(null)

    try {
      const parsedKeywords = keywordsText
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)

      const payload = {
        ...formData,
        seo_keywords: parsedKeywords,
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await safeParseResponse(res)
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save settings')

      if (data.settings) {
        setFormData(data.settings)
      }

      setSaveNotice({
        type: 'success',
        message: 'Master site settings & brand identity updated successfully!',
      })
    } catch (err: any) {
      setSaveNotice({
        type: 'error',
        message: err.message || 'Failed to save site settings',
      })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveNotice(null), 6000)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink-tertiary">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
        <p className="text-xs">Loading site configuration...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 py-2 sm:py-4 max-w-5xl">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4 sticky top-14 glass z-30 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-b-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Brand & Platform</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Site Settings & Identity
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Manage branding assets, contact details, social links, and SEO defaults.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={saving}
          className="flex-shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin text-accent-blue" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Publishing Changes...' : 'Save & Publish All'}</span>
        </Button>
      </div>

      {saveNotice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in-0 duration-150 ${
            saveNotice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
          }`}
        >
          {saveNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-accent-red flex-shrink-0" />
          )}
          <span>{saveNotice.message}</span>
        </div>
      )}

      {/* SECTION 1: BRANDING ASSETS & GALLERY UPLOADS */}
      <div className="border border-hairline bg-bg-elevated rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-ink border-b border-hairline pb-3">
          <ImageIcon className="w-4 h-4 text-accent-blue" />
          <span>Branding Assets & Media Gallery Uploads</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Logo */}
          <div className="bg-bg p-4 rounded-xl border border-hairline space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink block">Primary Logo</span>
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset('logo_url')}
                    className="text-[10px] text-accent-red hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-ink-tertiary">Main header icon / logo</p>
              <div className="mt-2 h-24 rounded-lg bg-bg-elevated border border-dashed border-hairline-strong flex items-center justify-center overflow-hidden p-2">
                {formData.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-ink-tertiary">No logo uploaded</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                id="upload-logo-input"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, 'logo_url')}
                className="hidden"
              />
              <label
                htmlFor="upload-logo-input"
                className="w-full cursor-pointer py-2 px-3 bg-bg-elevated hover:border-hairline-strong border border-hairline text-ink text-[11px] font-semibold rounded-pill flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
              >
                {uploadingField === 'logo_url' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-accent-blue" />
                )}
                <span>{formData.logo_url ? 'Replace Logo' : 'Upload Logo'}</span>
              </label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url || ''}
                onChange={handleChange}
                placeholder="Or paste image URL"
                className="w-full p-2 text-[10px] bg-bg-elevated border border-hairline rounded-lg font-mono text-ink"
              />
            </div>
          </div>

          {/* Full Logo */}
          <div className="bg-bg p-4 rounded-xl border border-hairline space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink block">Full / Wordmark Logo</span>
                {formData.full_logo_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset('full_logo_url')}
                    className="text-[10px] text-accent-red hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-ink-tertiary">Horizontal brand banner</p>
              <div className="mt-2 h-24 rounded-lg bg-bg-elevated border border-dashed border-hairline-strong flex items-center justify-center overflow-hidden p-2">
                {formData.full_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.full_logo_url} alt="Full Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-ink-tertiary">No full logo uploaded</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                id="upload-full-logo-input"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, 'full_logo_url')}
                className="hidden"
              />
              <label
                htmlFor="upload-full-logo-input"
                className="w-full cursor-pointer py-2 px-3 bg-bg-elevated hover:border-hairline-strong border border-hairline text-ink text-[11px] font-semibold rounded-pill flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
              >
                {uploadingField === 'full_logo_url' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-accent-blue" />
                )}
                <span>{formData.full_logo_url ? 'Replace Full Logo' : 'Upload Full Logo'}</span>
              </label>
              <input
                type="url"
                name="full_logo_url"
                value={formData.full_logo_url || ''}
                onChange={handleChange}
                placeholder="Or paste image URL"
                className="w-full p-2 text-[10px] bg-bg-elevated border border-hairline rounded-lg font-mono text-ink"
              />
            </div>
          </div>

          {/* Favicon */}
          <div className="bg-bg p-4 rounded-xl border border-hairline space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink block">Favicon</span>
                {formData.favicon_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset('favicon_url')}
                    className="text-[10px] text-accent-red hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-ink-tertiary">Browser tab icon (32x32)</p>
              <div className="mt-2 h-24 rounded-lg bg-bg-elevated border border-dashed border-hairline-strong flex items-center justify-center overflow-hidden p-2">
                {formData.favicon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.favicon_url} alt="Favicon" className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-[10px] text-ink-tertiary">No favicon uploaded</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                id="upload-favicon-input"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, 'favicon_url')}
                className="hidden"
              />
              <label
                htmlFor="upload-favicon-input"
                className="w-full cursor-pointer py-2 px-3 bg-bg-elevated hover:border-hairline-strong border border-hairline text-ink text-[11px] font-semibold rounded-pill flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
              >
                {uploadingField === 'favicon_url' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-accent-blue" />
                )}
                <span>{formData.favicon_url ? 'Replace Favicon' : 'Upload Favicon'}</span>
              </label>
              <input
                type="url"
                name="favicon_url"
                value={formData.favicon_url || ''}
                onChange={handleChange}
                placeholder="Or paste favicon URL"
                className="w-full p-2 text-[10px] bg-bg-elevated border border-hairline rounded-lg font-mono text-ink"
              />
            </div>
          </div>

          {/* OG Share Image */}
          <div className="bg-bg p-4 rounded-xl border border-hairline space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink block">OG Share Image</span>
                {formData.og_image_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset('og_image_url')}
                    className="text-[10px] text-accent-red hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-ink-tertiary">Facebook/Twitter banner (1200x630)</p>
              <div className="mt-2 h-24 rounded-lg bg-bg-elevated border border-dashed border-hairline-strong flex items-center justify-center overflow-hidden p-2">
                {formData.og_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.og_image_url} alt="OG Banner" className="max-h-full max-w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-ink-tertiary">No OG image uploaded</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="file"
                id="upload-og-input"
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, 'og_image_url')}
                className="hidden"
              />
              <label
                htmlFor="upload-og-input"
                className="w-full cursor-pointer py-2 px-3 bg-bg-elevated hover:border-hairline-strong border border-hairline text-ink text-[11px] font-semibold rounded-pill flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
              >
                {uploadingField === 'og_image_url' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-accent-blue" />
                )}
                <span>{formData.og_image_url ? 'Replace OG Banner' : 'Upload OG Banner'}</span>
              </label>
              <input
                type="url"
                name="og_image_url"
                value={formData.og_image_url || ''}
                onChange={handleChange}
                placeholder="Or paste banner URL"
                className="w-full p-2 text-[10px] bg-bg-elevated border border-hairline rounded-lg font-mono text-ink"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 2: BRAND & BUSINESS DETAILS */}
        <div className="p-6 bg-bg-elevated border border-hairline rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-ink border-b border-hairline pb-3">
            <Globe className="w-4 h-4 text-accent-blue" />
            <span>Brand & Identity</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Brand Name *</label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name || ''}
              onChange={handleChange}
              required
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Website URL</label>
            <input
              type="url"
              name="website_url"
              value={formData.website_url || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Brand Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Founded Year</label>
              <input
                type="number"
                name="founded_year"
                value={formData.founded_year || 2026}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Business Type</label>
              <input
                type="text"
                name="business_type"
                value={formData.business_type || ''}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: OFFICIAL CONTACT INFO */}
        <div className="p-6 bg-bg-elevated border border-hairline rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-ink border-b border-hairline pb-3">
            <Mail className="w-4 h-4 text-accent-blue" />
            <span>Official Contact Info</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Editorial Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Support Email</label>
            <input
              type="email"
              name="support_email"
              value={formData.support_email || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Official Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="+977 1 4XXXXXX"
                className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">WhatsApp Hotline</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleChange}
                placeholder="+977 98XXXXXXXX"
                className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Street Address</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                className="w-full p-2 text-xs bg-bg border border-hairline rounded-lg text-ink"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">District</label>
              <input
                type="text"
                name="district"
                value={formData.district || ''}
                onChange={handleChange}
                className="w-full p-2 text-xs bg-bg border border-hairline rounded-lg text-ink"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">Postal Code</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code || ''}
                onChange={handleChange}
                className="w-full p-2 text-xs bg-bg border border-hairline rounded-lg text-ink"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: SOCIAL NETWORKS */}
        <div className="p-6 bg-bg-elevated border border-hairline rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-ink border-b border-hairline pb-3">
            <Share2 className="w-4 h-4 text-accent-blue" />
            <span>Social Network Channels</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Instagram URL</label>
            <input
              type="url"
              name="instagram_url"
              value={formData.instagram_url || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">YouTube URL</label>
            <input
              type="url"
              name="youtube_url"
              value={formData.youtube_url || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Facebook URL</label>
            <input
              type="url"
              name="facebook_url"
              value={formData.facebook_url || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">TikTok</label>
              <input
                type="url"
                name="tiktok_url"
                value={formData.tiktok_url || ''}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">X (Twitter)</label>
              <input
                type="url"
                name="x_url"
                value={formData.x_url || ''}
                onChange={handleChange}
                className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: GLOBAL SEO DEFAULTS */}
        <div className="p-6 bg-bg-elevated border border-hairline rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-ink border-b border-hairline pb-3">
            <Search className="w-4 h-4 text-accent-blue" />
            <span>Search Engine Optimization (SEO)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Master SEO Meta Title</label>
            <input
              type="text"
              name="seo_title"
              value={formData.seo_title || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">SEO Meta Description</label>
            <textarea
              name="seo_description"
              rows={3}
              value={formData.seo_description || ''}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Target SEO Keywords (comma separated)
            </label>
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="e.g. nepal travel, everest base camp, trekking guide"
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Google Site Verification Code</label>
            <input
              type="text"
              name="google_site_verification"
              value={formData.google_site_verification || ''}
              onChange={handleChange}
              placeholder="google-site-verification=XXXXXXX"
              className="w-full p-2.5 text-sm bg-bg border border-hairline rounded-xl text-ink font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: PLATFORM MAINTENANCE & GATEWAY */}
      <div className="p-6 bg-bg-elevated border border-hairline rounded-2xl space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-ink border-b border-hairline pb-3">
          <Settings className="w-4 h-4 text-accent-blue" />
          <span>Platform Gate & Maintenance Controls</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-hairline">
          <div>
            <span className="font-bold text-sm text-ink block">Public Website Status</span>
            <p className="text-xs text-ink-secondary mt-0.5">
              When disabled, public visitors will see a dignified maintenance landing page.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active ?? true}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-hairline-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-hairline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={saving}
          className="min-w-[200px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin text-accent-blue" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Publishing Changes...' : 'Save & Publish All Settings'}</span>
        </Button>
      </div>
    </form>
  )
}
