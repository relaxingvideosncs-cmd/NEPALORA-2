import { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nepalora.com'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/prepare-for-nepal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/trekking-adventure`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/recovery-healing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  try {
    const supabase = createPublicClient()
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')

    if (articles && articles.length > 0) {
      const articleRoutes: MetadataRoute.Sitemap = articles.map((art) => ({
        url: `${siteUrl}/article/${art.slug}`,
        lastModified: new Date(art.updated_at || art.published_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
      return [...staticRoutes, ...articleRoutes]
    }
  } catch (err) {
    console.warn('Could not load articles for sitemap:', err)
  }

  return staticRoutes
}
