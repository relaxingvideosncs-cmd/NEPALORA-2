'use client'

import React, { useState } from 'react'
import { Download, Mail, CheckCircle2, Loader2, X, Sparkles, ShieldCheck } from 'lucide-react'
import { ArticleJSON } from '@/types/article'
import { generateAndDownloadArticlePDF } from '@/lib/pdf/generateArticlePDF'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface DownloadGuideModalProps {
  isOpen: boolean
  onClose: () => void
  article: ArticleJSON
}

export function DownloadGuideModal({
  isOpen,
  onClose,
  article,
}: DownloadGuideModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Subscribe to newsletter / capture lead in background
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          article_slug: article.slug,
          source: 'download_pdf_guide',
        }),
      })

      try {
        localStorage.setItem('soulofnepal_subscriber_email', email.trim())
      } catch {
        // Ignore
      }

      setSuccess(true)

      // 2. Generate and download PDF
      setTimeout(() => {
        try {
          generateAndDownloadArticlePDF(article)
        } catch (pdfErr) {
          console.warn('PDF generation error:', pdfErr)
        }

        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 1500)
      }, 500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150 not-prose">
      <div className="bg-bg-elevated rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-hairline relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-tertiary hover:text-ink rounded-pill hover:bg-bg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-3 animate-in fade-in-0 duration-200">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-ink">
              Downloading PDF Guide
            </h3>
            <p className="text-xs text-ink-secondary">
              Your formatted PDF document is downloading directly to your device.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Badge tone="blue" className="mb-1">
                <Sparkles className="w-3 h-3 mr-1 text-accent-blue" />
                Free Offline PDF Edition
              </Badge>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink leading-snug">
                Download Offline Guide
              </h3>

              <p className="text-xs text-ink-secondary leading-relaxed">
                Take <strong className="text-ink">&quot;{article.title}&quot;</strong> with you onto the trail as an offline PDF document.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="traveler@example.com"
                    className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-bg border border-hairline rounded-xl text-xs text-ink focus:border-accent-blue focus:outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {error && (
                <p className="text-xs text-accent-red font-medium">{error}</p>
              )}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                disabled={loading}
                className="w-full font-bold shadow-md"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{loading ? 'Preparing Document...' : 'Download PDF Guide'}</span>
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-ink-tertiary pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero spam. Unsubscribe anytime with 1 click.</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
