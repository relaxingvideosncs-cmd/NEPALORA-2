/**
 * Cloudinary URL transformation utilities for instant format normalization,
 * standard delivery profiles, and responsive delivery.
 */

export type ImageProfile = 'thumb' | 'card' | 'article' | 'hero' | 'full'

export const PROFILE_TRANSFORMS: Record<ImageProfile, string> = {
  thumb: 'w_1200,c_limit,f_auto,q_auto:best',
  card: 'w_1600,c_limit,f_auto,q_auto:best',
  article: 'w_2560,c_limit,f_auto,q_auto:best',
  hero: 'w_2880,c_limit,f_auto,q_auto:best',
  full: 'f_auto',
}

/**
 * Normalizes any image URL to guarantee proper delivery format, compression,
 * and delivery profile sizing without stripping folder paths.
 */
export function getWebImageUrl(
  url?: string | null,
  profile?: ImageProfile,
  customWidth?: number
): string {
  if (!url || typeof url !== 'string') return ''

  // For local static images (e.g. /images/...)
  if (url.startsWith('/') && !url.includes('cloudinary.com')) {
    return url
  }

  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url
  }

  // Replace raw .heic / .heif / .raw / .tiff extensions with .jpg for browser compatibility
  let cleanUrl = url
  if (cleanUrl.match(/\.(heic|heif|raw|tiff|bmp)$/i)) {
    cleanUrl = cleanUrl.replace(/\.(heic|heif|raw|tiff|bmp)$/i, '.jpg')
  }

  let transform = 'f_auto,q_auto'
  if (customWidth) {
    transform = `w_${customWidth},c_limit,f_auto,q_auto`
  } else if (profile && PROFILE_TRANSFORMS[profile]) {
    transform = PROFILE_TRANSFORMS[profile]
  }

  const uploadIdx = cleanUrl.indexOf('/upload/')
  if (uploadIdx === -1) return cleanUrl

  const prefix = cleanUrl.slice(0, uploadIdx + 8) // 'https://res.cloudinary.com/.../upload/'
  const rest = cleanUrl.slice(uploadIdx + 8)

  const parts = rest.split('/')
  const nonTransformParts: string[] = []
  let foundVersionOrFolder = false

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (foundVersionOrFolder) {
      nonTransformParts.push(p)
    } else if (p.match(/^v\d+$/)) {
      foundVersionOrFolder = true
      nonTransformParts.push(p)
    } else if (
      p.includes('f_auto') ||
      p.includes('q_auto') ||
      p.match(/^(?:w|h|c|q|f|e|g|r|b|co|dpr|fl|t)_[^/]+$/) ||
      p.includes(',')
    ) {
      // Transformation segment to replace
    } else {
      // Folder or asset name
      foundVersionOrFolder = true
      nonTransformParts.push(p)
    }
  }

  const cleanPath = nonTransformParts.join('/')
  return `${prefix}${transform}/${cleanPath}`
}

/**
 * Returns a tiny (~0.5KB) ultra-fast blurred placeholder URL for Cloudinary assets.
 */
export function getCloudinaryBlurUrl(url?: string | null): string | null {
  if (!url) return null
  return getWebImageUrl(url, undefined, 32)
}

/**
 * Returns an optimized Cloudinary delivery URL with automatic format (WebP/AVIF)
 * and responsive width scaling.
 */
export function getCloudinaryOptimizedUrl(
  url?: string | null,
  options?: { width?: number; quality?: string | number; profile?: ImageProfile }
): string {
  if (!url) return ''
  return getWebImageUrl(url, options?.profile, options?.width)
}
