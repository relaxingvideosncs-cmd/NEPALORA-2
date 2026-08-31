import React from 'react'
import Link from 'next/link'
import { getArticleFeaturedImage } from '@/lib/article/imageHelper'
import { Badge } from '@/components/ui/Badge'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'

interface ArticleCardProps {
  article: any
  featured?: boolean
  priority?: boolean
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const cardImage = getArticleFeaturedImage(article)
  const categoryName = article.category?.name || 'Guide'
  const categorySlug = article.category?.slug || ''

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-GB')
    : ''

  const badgeTone =
    categorySlug.includes('trekking') || categorySlug.includes('adventure')
      ? 'blue'
      : categorySlug.includes('recovery') || categorySlug.includes('healing')
      ? 'red'
      : 'neutral'

  return (
    <Link
      href={`/article/${article.slug}`}
      className={`
        group block reveal border border-hairline rounded-2xl bg-bg-elevated
        hover:border-hairline-strong shadow-xs hover:shadow-md transition-all duration-300
        overflow-hidden flex flex-col justify-between active:scale-[0.99]
        ${featured ? 'md:col-span-2' : ''}
      `}
    >
      {/* Cover Image with Cloudinary Progressive Blur */}
      {cardImage && (
        <div
          className={`
            relative w-full bg-hairline overflow-hidden
            ${featured ? 'aspect-[16/9]' : 'aspect-[16/10] sm:aspect-[4/3]'}
          `}
        >
          <ProgressiveImage
            src={cardImage}
            alt={article.title || 'Article cover'}
            profile={featured ? 'card' : 'thumb'}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <Badge tone={badgeTone}>{categoryName}</Badge>
            {formattedDate && (
              <span className="text-[11px] text-ink-tertiary font-mono">
                {formattedDate}
              </span>
            )}
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-ink group-hover:text-accent-blue transition-colors leading-snug line-clamp-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="mt-2 text-xs text-ink-secondary line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs font-semibold text-ink">
          <span>Read guide →</span>
          <span className="text-[11px] text-ink-tertiary">Field Guide</span>
        </div>
      </div>
    </Link>
  )
}
