/**
 * Direct & Simple Like / Unlike Handler.
 * Pure connection between DB like_count and UI with zero intermediate layers.
 */

const STORAGE_KEY = 'soul_of_nepal_liked_photos'

export function getStoredLikedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function isPhotoLikedLocally(photoId: string): boolean {
  if (!photoId) return false
  return getStoredLikedIds().has(photoId)
}

export async function togglePhotoLike(
  photoId: string,
  currentCount: number
): Promise<{ liked: boolean; count: number }> {
  if (!photoId) return { liked: false, count: currentCount }

  const stored = getStoredLikedIds()
  const isCurrentlyLiked = stored.has(photoId)
  const nextLiked = !isCurrentlyLiked
  const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1)

  // 1. Update session storage
  if (nextLiked) {
    stored.add(photoId)
  } else {
    stored.delete(photoId)
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(stored)))
  } catch {}

  // 2. Broadcast to any other cards showing this photo
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('gallery_like_sync', {
        detail: { photoId, liked: nextLiked, count: nextCount },
      })
    )
  }

  // 3. Update Supabase database directly
  try {
    fetch('/api/galleries', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toggleLikeId: photoId,
        likeAction: nextLiked ? 'like' : 'unlike',
      }),
    }).catch((err) => console.warn('DB like update error:', err))
  } catch {}

  return { liked: nextLiked, count: nextCount }
}

export const toggleGlobalLike = togglePhotoLike
export const submitGlobalLike = togglePhotoLike
