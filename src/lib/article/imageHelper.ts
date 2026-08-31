import { ArticleBlock, ImageBlock, ArticleJSON, ArticleRecord } from '@/types/article'

/**
 * Intelligent Featured / Card Preview Image Resolver.
 * Extracts the explicit uploaded featured image or the first Image block in the article.
 * Returns null if no image was uploaded (no hardcoded static fallbacks).
 */
export function getArticleFeaturedImage(
  article?: ArticleRecord | ArticleJSON | Record<string, unknown> | null
): string | null {
  if (!article) return null

  const art = article as Record<string, any>

  // 1. Check explicit featured_image in content_json or article object
  const explicitFeatured =
    art.content_json?.featured_image?.src ||
    art.featured_image?.src ||
    art.featured_image_url
  if (explicitFeatured && typeof explicitFeatured === 'string' && explicitFeatured.trim().length > 0) {
    return explicitFeatured.trim()
  }

  // 2. Scan blocks for the first image block
  const blocks: ArticleBlock[] = art.content_json?.blocks || art.blocks || []
  if (Array.isArray(blocks)) {
    const firstImageBlock = blocks.find(
      (b) => b && b.type === 'image' && (b as ImageBlock).src
    ) as ImageBlock | undefined

    if (firstImageBlock?.src && typeof firstImageBlock.src === 'string' && firstImageBlock.src.trim().length > 0) {
      return firstImageBlock.src.trim()
    }
  }

  return null
}
