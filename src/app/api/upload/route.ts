import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const [mediaRes, articlesRes, galleryRes, bulletinsRes, settingsRes] = await Promise.all([
      supabase.from('media').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('articles').select('id, title, slug, content_json'),
      supabase.from('gallery_photos').select('id, title, gallery_slot, image_url'),
      supabase.from('bulletins').select('id, title, picture_url'),
      supabase.from('site_settings').select('logo_url, full_logo_url, favicon_url, og_image_url').limit(1).maybeSingle(),
    ])

    const mediaList = mediaRes.data || []
    const articles = articlesRes.data || []
    const galleryPhotos = galleryRes.data || []
    const bulletins = bulletinsRes.data || []
    const settings: any = settingsRes.data || {}

    // Build usage map for fast lookup
    const enrichedMedia = mediaList.map((item: any) => {
      const url = item.secure_url || ''
      const publicId = item.cloudinary_public_id || ''
      const idPart = publicId.split('/').pop() || ''

      const matchesUrl = (targetUrl?: string | null) => {
        if (!targetUrl) return false
        if (targetUrl === url) return true
        if (publicId && targetUrl.includes(publicId)) return true
        if (idPart && idPart.length > 5 && targetUrl.includes(idPart)) return true
        return false
      }

      const usages: Array<{ type: 'article' | 'gallery' | 'bulletin' | 'setting'; title: string; detail?: string }> = []

      // 1. Check Articles
      for (const art of articles) {
        const contentStr = typeof art.content_json === 'string' ? art.content_json : JSON.stringify(art.content_json || {})
        if (matchesUrl(art.content_json?.featured_image?.src) || contentStr.includes(publicId) || (idPart && idPart.length > 5 && contentStr.includes(idPart))) {
          usages.push({ type: 'article', title: art.title, detail: `/article/${art.slug}` })
        }
      }

      // 2. Check Gallery
      for (const photo of galleryPhotos) {
        if (matchesUrl(photo.image_url)) {
          usages.push({ type: 'gallery', title: photo.title || photo.gallery_slot, detail: `Slot: ${photo.gallery_slot}` })
        }
      }

      // 3. Check Bulletins
      for (const b of bulletins) {
        if (matchesUrl(b.picture_url)) {
          usages.push({ type: 'bulletin', title: b.title })
        }
      }

      // 4. Check Site Settings
      if (matchesUrl(settings.logo_url) || matchesUrl(settings.full_logo_url)) {
        usages.push({ type: 'setting', title: 'Site Brand Logo' })
      }
      if (matchesUrl(settings.favicon_url)) {
        usages.push({ type: 'setting', title: 'Site Favicon' })
      }
      if (matchesUrl(settings.og_image_url)) {
        usages.push({ type: 'setting', title: 'Social Share OG Image' })
      }

      return {
        ...item,
        bytes: item.bytes || 0,
        used_in: usages,
        is_unused: usages.length === 0,
      }
    })

    return NextResponse.json({ media: enrichedMedia })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list media' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const altText = (formData.get('alt_text') as string) || ''
    const title = (formData.get('title') as string) || ''
    const caption = (formData.get('caption') as string) || ''
    const credit = (formData.get('credit') as string) || 'Nepalora'
    const requestedFolder = (formData.get('folder') as string) || 'nepalora/articles'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 1. Validate file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/heic',
      'image/heif',
      'image/tiff',
    ]
    const fileType = file.type?.toLowerCase()
    const fileName = file.name?.toLowerCase() || ''
    const isAllowedType =
      allowedTypes.includes(fileType) ||
      /\.(jpe?g|png|webp|avif|heic|heif|tiff|bmp)$/i.test(fileName)

    if (!isAllowedType) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed formats: JPG, PNG, WebP, AVIF, HEIC, TIFF.' },
        { status: 400 }
      )
    }

    // 2. Validate max upload size (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 25 MB limit.' },
        { status: 400 }
      )
    }

    // 3. Ensure organized folder path
    const validFolders = [
      'nepalora/articles',
      'nepalora/gallery',
      'nepalora/destinations',
      'nepalora/food',
      'nepalora/events',
      'nepalora/places',
      'nepalora/site',
      'nepalora/misc',
    ]
    const folder = validFolders.includes(requestedFolder) ? requestedFolder : 'nepalora/articles'

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await uploadToCloudinary(buffer, folder)

    // Save to media table in Supabase
    try {
      await supabase.from('media').insert({
        cloudinary_public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes || file.size,
        alt_text: altText || null,
        title: title || null,
        caption: caption || null,
        credit: credit || null,
      })
    } catch (dbErr) {
      console.warn('Could not insert media into database:', dbErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        alt_text: altText,
        title,
        caption,
        credit,
      },
    })
  } catch (err: any) {
    console.error('Image upload error:', err)
    return NextResponse.json(
      { error: err.message || 'Image upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Check Content-Type to decide: bulk (JSON body) vs single (query param)
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      // ── Bulk delete ──────────────────────────────────────────────────────
      const body = await req.json()
      const ids: string[] = body?.ids || []

      if (!ids.length) {
        return NextResponse.json({ error: 'No IDs provided.' }, { status: 400 })
      }

      // Fetch all public IDs from DB
      const { data: rows } = await supabase
        .from('media')
        .select('id, cloudinary_public_id, secure_url')
        .in('id', ids)

      // Delete from Supabase first
      await supabase.from('media').delete().in('id', ids)

      // Then delete from Cloudinary (best-effort, don't block on failure)
      if (rows && rows.length > 0) {
        await Promise.allSettled(
          rows.map((row) => {
            const pid = row.cloudinary_public_id || row.secure_url
            if (pid) return deleteFromCloudinary(pid)
          })
        )
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${ids.length} image(s) from database and Cloudinary.`,
      })
    }

    // ── Single delete (legacy query param) ──────────────────────────────
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const publicId = searchParams.get('public_id')

    let targetPublicId = publicId

    if (id) {
      const { data: mediaRow } = await supabase
        .from('media')
        .select('cloudinary_public_id, secure_url')
        .eq('id', id)
        .single()

      if (mediaRow) {
        targetPublicId = mediaRow.cloudinary_public_id || mediaRow.secure_url
      }

      await supabase.from('media').delete().eq('id', id)
    }

    if (targetPublicId) {
      await deleteFromCloudinary(targetPublicId)
    }

    return NextResponse.json({ success: true, message: 'Deleted from Supabase and Cloudinary' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete media' }, { status: 500 })
  }
}
