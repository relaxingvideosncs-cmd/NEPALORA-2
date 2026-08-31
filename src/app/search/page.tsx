import React from 'react'
import { searchArticles } from '@/lib/article/service'
import { InstantSearchBar } from '@/components/search/InstantSearchBar'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Badge } from '@/components/ui/Badge'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata = {
  title: 'Search Nepal Guides & Topics',
  description: 'Search structured guides for traveling, trekking routes, packing, visas, and wellness retreats in Nepal.',
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q || ''
  const results = query ? await searchArticles(query) : []

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8">
      {/* Search Header & Live Input */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="blue">Explore Knowledge</Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-2">
          Search Nepalora
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mb-6">
          Instant search across article titles, body paragraphs, keywords, categories, and tags.
        </p>

        <InstantSearchBar
          autoFocus={!query}
          initialQuery={query}
          placeholder="Type any keyword or topic (e.g. visa, Everest, yoga, altitude)..."
        />
      </div>

      {/* Results Section */}
      <div className="space-y-4 pt-2">
        {query && (
          <div className="flex items-center justify-between border-b border-hairline pb-2 text-xs text-ink-secondary">
            <span>
              Showing results for <strong className="text-ink">&quot;{query}&quot;</strong>
            </span>
            <Badge tone="neutral">{results.length} guides found</Badge>
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-8 sm:p-12 border border-dashed border-hairline-strong rounded-2xl text-center text-ink-tertiary bg-bg-elevated/40 space-y-2">
            <p className="font-semibold text-ink">No published articles matched &quot;{query}&quot;</p>
            <p className="text-xs">Try searching for keywords like &quot;trekking&quot;, &quot;visa&quot;, &quot;himalayas&quot;, or &quot;yoga&quot;.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {results.map((art: any) => (
            <ArticleCard key={art.id} article={art} />
          ))}
        </div>
      </div>
    </div>
  )
}
