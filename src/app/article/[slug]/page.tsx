import React from 'react'
import { notFound } from 'next/navigation'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { AdSlot } from '@/components/ads/AdSlot'
import { getArticleBySlug, getSimilarArticles } from '@/lib/article/service'
import { ArticleJSON } from '@/types/article'
import { getArticleFeaturedImage } from '@/lib/article/imageHelper'
import { ArticleCard } from '@/components/article/ArticleCard'
import { Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'

// Fallback seed article
const fallbackArticle: ArticleJSON = {
  title: 'Best Time to Trek in Nepal: Complete Seasonal Guide',
  slug: 'best-time-to-trek-in-nepal',
  category: 'trekking-adventure',
  excerpt: 'A practical guide to choosing the best trekking season in the Himalayas between autumn skies and spring blooms.',
  author: 'Nepalora Editorial',
  tags: ['trekking', 'nepal', 'himalayas', 'seasons'],
  featured_image: {
    src: '/images/nepal/himalayan-sunrise-viewpoint-gold.webp',
    alt: 'Dawn breaking over the Himalayan mountain ridges',
    caption: 'Dawn breaking over the Himalayan mountain horizons as trekkers watch the sunrise.',
    credit: 'Nepalora Photography',
  },
  blocks: [
    {
      type: 'paragraph',
      text: "Nepal offers some of the world's most spectacular trekking routes, but timing your journey correctly is essential for safety, clear passes, and optimal mountain vistas.",
    },
    {
      type: 'heading',
      level: 2,
      text: 'Spring Season (March to May)',
    },
    {
      type: 'paragraph',
      text: 'Spring is famous for blooming rhododendron forests across the lower valleys, warm daytime climbing conditions, and active wildlife along the trails.',
    },
    {
      type: 'image',
      src: '/images/nepal/himalayan-village-greenery-lodge.webp',
      alt: 'Lush green terraced valleys in the Himalayan foothills',
      caption: 'Lush greenery and rustic teahouse lodges in the lower valleys during spring bloom.',
      credit: 'Nepalora Photography',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Lush flora and vibrant rhododendron forests across Annapurna, Langtang, and Manaslu',
        'Pleasantly warm daytime temperatures suitable for high-pass ascents',
        'Clear morning views before gentle afternoon cloud buildups',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Autumn Season (September to November)',
    },
    {
      type: 'paragraph',
      text: 'Autumn offers the crispest, most reliable crystal-clear mountain vistas right after the monsoon rains wash away atmospheric dust and haze.',
    },
    {
      type: 'image',
      src: '/images/nepal/mountain-peak-crest.webp',
      alt: 'Sharp mountain summit crest with pristine snow lines',
      caption: 'Pristine, untouched summit ridges under crisp crystal-blue October skies.',
      credit: 'Nepalora Photography',
    },
    {
      type: 'quote',
      text: 'The Himalayas in October present an unmatched clarity where eight-thousand-meter giants dominate the horizon in razor-sharp definition.',
      author: 'Senior Himalayan Mountain Guide',
    },
  ],
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const record = await getArticleBySlug(slug)
  const article = record?.content_json || (slug === fallbackArticle.slug ? fallbackArticle : null)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soulofnepal.com'

  if (!article) {
    return { title: 'Article Not Found' }
  }

  const coverImage = getArticleFeaturedImage(article)

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `${siteUrl}/article/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url: `${siteUrl}/article/${article.slug}`,
      images: coverImage ? [{ url: coverImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: coverImage ? [coverImage] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params

  const record = await getArticleBySlug(slug)
  const article: ArticleJSON | null = record?.content_json || (slug === fallbackArticle.slug ? fallbackArticle : null)

  if (!article) {
    notFound()
  }

  const [similarArticles] = await Promise.all([
    getSimilarArticles(article.category, slug, 3),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soulofnepal.com'
  const coverImage = getArticleFeaturedImage(article)

  // Technical SEO Schema
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: record?.published_at || new Date().toISOString(),
    dateModified: record?.updated_at || new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/article/${article.slug}`,
    },
    author: {
      '@type': 'Person',
      name: article.author || 'Nepalora Editorial',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nepalora',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/favicon.ico`,
      },
    },
    keywords: article.tags?.join(', ') || 'nepal, travel, trekking, himalayas',
  }

  if (coverImage) {
    jsonLd.image = [coverImage]
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AdSlot slug="article-top" />

      {/* Main Article Content */}
      <ArticleRenderer article={article} isEditable={false} />

      <AdSlot slug="article-bottom" />

      {/* Similar & Recommended Articles Section */}
      {similarArticles.length > 0 && (
        <section className="max-w-4xl mx-auto pt-8 border-t border-hairline space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge tone="blue" className="mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Keep Reading
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Recommended & Similar Guides
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {similarArticles.map((simArt: any) => (
              <ArticleCard key={simArt.id} article={simArt} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
