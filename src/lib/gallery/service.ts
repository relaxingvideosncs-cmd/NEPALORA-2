import { createClient, createPublicClient } from '@/lib/supabase/server'
import { GalleryPhotoRecord, GallerySlot } from '@/types/database'

/**
 * Fetches published gallery photos for a given slot directly from Supabase / Cloudinary.
 * Returns [] if no photos are uploaded yet (no dummy static fallbacks).
 */
export async function getGalleryPhotos(slot: GallerySlot): Promise<GalleryPhotoRecord[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('gallery_photos')
      .select(`
        id,
        gallery_slot,
        image_url,
        title,
        category,
        description,
        location,
        seo_alt,
        like_count,
        display_order
      `)
      .eq('gallery_slot', slot)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (!error && data) {
      return data as unknown as GalleryPhotoRecord[]
    }
  } catch (err) {
    console.warn(`Error fetching gallery photos for slot [${slot}]:`, err)
  }

  return []
}

/**
 * Fetches all photos across all 5 slots or a specific slot for the staff controller.
 */
export async function getAllGalleryPhotosAdmin(slot?: GallerySlot): Promise<GalleryPhotoRecord[]> {
  try {
    const supabase = await createClient()
    let query = supabase.from('gallery_photos').select('*').order('display_order', { ascending: true })

    if (slot) {
      query = query.eq('gallery_slot', slot)
    }

    const { data, error } = await query

    if (!error && data) {
      return data as GalleryPhotoRecord[]
    }
  } catch (err) {
    console.warn('Error fetching admin gallery photos:', err)
  }

  return []
}

/**
 * Fetches all published photos across all 5 galleries for the dedicated /gallery showcase.
 */
export async function getAllPublishedGalleryPhotos(): Promise<GalleryPhotoRecord[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('gallery_photos')
      .select(`
        id,
        gallery_slot,
        image_url,
        title,
        category,
        description,
        location,
        seo_alt,
        like_count,
        display_order,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data as unknown as GalleryPhotoRecord[]
    }
  } catch (err) {
    console.warn('Error fetching all published gallery photos:', err)
  }

  return []
}
