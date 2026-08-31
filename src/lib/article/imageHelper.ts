import { ArticleBlock, ImageBlock } from '@/types/article'

/**
 * Intelligent Featured / Card Preview Image Resolver.
 * Extracts the explicit uploaded featured image or the first Image block in the article.
 * Returns null if no image was uploaded (no hardcoded static fallbacks).
 */
export function getArticleFeaturedImage(article: any): string | null {
  if (!article) return null

  // 1. Check explicit featured_image in content_json or article object
  const explicitFeatured =
    article.content_json?.featured_image?.src ||
    article.featured_image?.src ||
    article.featured_image_url
  if (explicitFeatured && typeof explicitFeatured === 'string' && explicitFeatured.trim().length > 0) {
    return explicitFeatured.trim()
  }

  // 2. Scan blocks for the first image block
  const blocks: ArticleBlock[] = article.content_json?.blocks || article.blocks || []
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
