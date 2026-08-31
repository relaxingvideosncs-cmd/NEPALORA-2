/**
 * Cloudinary URL transformation utilities for instant format normalization and dynamic delivery.
 */

/**
 * Normalizes any image URL (especially iPhone HEIC / RAW / TIFF files stored in Cloudinary)
 * to guarantee that all web browsers (Chrome, Safari, Edge, Firefox) receive a valid
 * auto-optimized WebP/JPEG delivery stream.
 */
export function getWebImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return ''
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url
  }

  // If already contains transformations, return
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url
  }

  // Replace raw .heic / .heif / .tiff extensions with .jpg for browser compatibility
  let cleanUrl = url
  if (cleanUrl.match(/\.(heic|heif|raw|tiff|bmp)$/i)) {
    cleanUrl = cleanUrl.replace(/\.(heic|heif|raw|tiff|bmp)$/i, '.jpg')
  }

  // Inject f_auto,q_auto transformation into Cloudinary delivery URL
  return cleanUrl.replace(
    /\/upload\/(?:v\d+\/)?/,
    (match) => match.replace('/upload/', '/upload/f_auto,q_auto/')
  )
}

/**
 * Returns a tiny (~0.5KB) ultra-fast blurred placeholder URL for Cloudinary assets.
 */
export function getCloudinaryBlurUrl(url?: string | null): string | null {
  if (!url) return null
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return null
  }

  let cleanUrl = url
  if (cleanUrl.match(/\.(heic|heif|raw|tiff|bmp)$/i)) {
    cleanUrl = cleanUrl.replace(/\.(heic|heif|raw|tiff|bmp)$/i, '.jpg')
  }

  return cleanUrl.replace(
    /\/upload\/(?:v\d+\/)?/,
    (match) => match.replace('/upload/', '/upload/w_32,q_10,e_blur:1000,f_auto/')
  )
}

/**
 * Returns an optimized Cloudinary delivery URL with automatic format (WebP/AVIF)
 * and responsive width scaling.
 */
export function getCloudinaryOptimizedUrl(
  url?: string | null,
  options?: { width?: number; quality?: string | number }
): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url
  }

  let cleanUrl = url
  if (cleanUrl.match(/\.(heic|heif|raw|tiff|bmp)$/i)) {
    cleanUrl = cleanUrl.replace(/\.(heic|heif|raw|tiff|bmp)$/i, '.jpg')
  }

  const w = options?.width ? `w_${options.width},` : ''
  const q = options?.quality ? `q_${options.quality},` : 'q_auto,'
  const transform = `${w}${q}f_auto/`

  return cleanUrl.replace(
    /\/upload\/(?:v\d+\/)?/,
    (match) => match.replace('/upload/', `/upload/${transform}`)
  )
}
