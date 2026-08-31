import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { GallerySlot } from '@/types/database'
import { getAllGalleryPhotosAdmin, getAllPublishedGalleryPhotos } from '@/lib/gallery/service'
import { deleteFromCloudinary } from '@/lib/cloudinary/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slot = searchParams.get('slot') as GallerySlot | null
    const mode = searchParams.get('mode') // 'all_published' for /gallery

    if (mode === 'all_published') {
      const items = await getAllPublishedGalleryPhotos()
      return NextResponse.json({ success: true, items })
    }

    const items = await getAllGalleryPhotosAdmin(slot || undefined)
    return NextResponse.json({ success: true, items })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch gallery photos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      gallery_slot,
      image_url,
      title,
      category,
      description,
      location,
      seo_alt,
      seo_keywords,
      display_order,
      is_active,
    } = body

    if (!gallery_slot || !title || !image_url) {
      return NextResponse.json({ error: 'Gallery slot, title, and Cloudinary image URL are required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('gallery_photos')
      .insert({
        gallery_slot,
        image_url,
        title,
        category: category || 'Mountains & Landscapes',
        description: description || null,
        location: location || null,
        seo_alt: seo_alt || title,
        seo_keywords: Array.isArray(seo_keywords) ? seo_keywords : null,
        like_count: 0,
        display_order: Number(display_order) || 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      revalidatePath('/')
      revalidatePath('/gallery')
      revalidatePath('/prepare-for-nepal')
      revalidatePath('/trekking-adventure')
      revalidatePath('/recovery-healing')
    } catch (e) {
      console.warn('Gallery revalidation notice:', e)
    }

    return NextResponse.json({ success: true, photo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add gallery photo' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    // 1. Like / Unlike Toggle (Instagram style)
    if (body.toggleLikeId || body.incrementLikeId) {
      const photoId = body.toggleLikeId || body.incrementLikeId
      const action = body.likeAction === 'unlike' ? 'unlike' : 'like'

      const { data: current } = await supabase
        .from('gallery_photos')
        .select('like_count')
        .eq('id', photoId)
        .single()

      const currentCount = current?.like_count || 0
      const newCount = action === 'unlike' ? Math.max(0, currentCount - 1) : currentCount + 1

      const { data, error } = await supabase
        .from('gallery_photos')
        .update({ like_count: newCount })
        .eq('id', photoId)
        .select('like_count')
        .single()

      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, like_count: data.like_count, action })
    }

    // 2. Batch Reorder
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder.map((item: { id: string; display_order: number }) =>
        supabase.from('gallery_photos').update({ display_order: item.display_order }).eq('id', item.id)
      )
      await Promise.all(updates)

      try {
        revalidatePath('/')
        revalidatePath('/gallery')
      } catch (e) {
        console.warn('Gallery revalidation notice:', e)
      }

      return NextResponse.json({ success: true, message: 'Sequence updated successfully' })
    }

    // 3. Single Item Update
    const { id, created_at, ...cleanPayload } = body
    if (!id) {
      return NextResponse.json({ error: 'Photo ID is required for update.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('gallery_photos')
      .update({
        ...cleanPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      revalidatePath('/')
      revalidatePath('/gallery')
      revalidatePath('/prepare-for-nepal')
      revalidatePath('/trekking-adventure')
      revalidatePath('/recovery-healing')
    } catch (e) {
      console.warn('Gallery revalidation notice:', e)
    }

    return NextResponse.json({ success: true, photo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update gallery photo' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Photo ID is required.' }, { status: 400 })
    }

    // 1. Fetch photo to get its image_url before deletion
    const { data: photo } = await supabase
      .from('gallery_photos')
      .select('image_url')
      .eq('id', id)
      .single()

    // 2. Delete from Supabase
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Permanently delete from Cloudinary storage
    if (photo?.image_url) {
      await deleteFromCloudinary(photo.image_url)
    }

    try {
      revalidatePath('/')
      revalidatePath('/gallery')
      revalidatePath('/prepare-for-nepal')
      revalidatePath('/trekking-adventure')
      revalidatePath('/recovery-healing')
    } catch (e) {
      console.warn('Gallery revalidation notice:', e)
    }

    return NextResponse.json({ success: true, message: 'Deleted from database and Cloudinary storage' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete photo' }, { status: 500 })
  }
}
