import React from 'react'
import { Metadata } from 'next'
import { AdSlot } from '@/components/ads/AdSlot'
import { Badge } from '@/components/ui/Badge'
import { getAllPublishedArticles } from '@/lib/article/service'
import { AllArticlesBrowser } from '@/components/article/AllArticlesBrowser'
import { BookOpen } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'All Articles & Field Guides | Nepalora',
  description:
    'Browse all independent Nepal travel field guides, Himalayan trekking routes, visa checklists, and post-trek wellness articles.',
}

export default async function AllArticlesPage() {
  const articles = await getAllPublishedArticles()

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Top Banner Ad Slot */}
      <AdSlot slug="category-top" />

      {/* Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="blue">
            <BookOpen className="w-3 h-3 mr-1" />
            Knowledge Base
          </Badge>
          <span className="text-xs text-ink-tertiary font-mono">
            {articles.length} Field Guides
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight">
          All Articles & Guides
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl leading-relaxed">
          Structured field guides, Himalayan route breakdowns, visa on arrival checklists, and post-trek wellness protocols.
        </p>
      </header>

      {/* Interactive Search, Sort & Filter Browser */}
      <AllArticlesBrowser initialArticles={articles as any} />

      {/* Bottom Ad Slot */}
      <AdSlot slug="category-bottom" />
    </div>
  )
}
