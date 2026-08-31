'use client'

import React, { useState } from 'react'
import { Share2, Check, Download, Clock, FileText } from 'lucide-react'
import { DownloadGuideModal } from './DownloadGuideModal'
import { ArticleJSON } from '@/types/article'
import { Button } from '@/components/ui/Button'

interface ArticleActionsProps {
  article: ArticleJSON
  wordCount: number
}

export function ArticleActions({ article, wordCount }: ArticleActionsProps) {
  const [copied, setCopied] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const handleShare = async () => {
    if (typeof window === 'undefined') return

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: window.location.href,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Ignore
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 border-y border-hairline text-xs text-ink-secondary my-6 not-prose">
        {/* Reading Time & Word Count */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <Clock className="w-3.5 h-3.5 text-accent-blue" />
            <span>{readingTime} min read</span>
          </span>
          <span className="flex items-center gap-1.5 text-ink-tertiary">
            <FileText className="w-3.5 h-3.5 text-ink-tertiary" />
            <span>{wordCount} words</span>
          </span>
        </div>

        {/* Action Buttons: Share & Download PDF */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none"
            title="Share or Copy Link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-ink-secondary" />
                <span>Share</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={() => setDownloadModalOpen(true)}
            className="flex-1 sm:flex-none font-semibold shadow-xs"
            title="Download formatted PDF guide"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Newsletter Email Capture Modal */}
      <DownloadGuideModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        article={article}
      />
    </>
  )
}
