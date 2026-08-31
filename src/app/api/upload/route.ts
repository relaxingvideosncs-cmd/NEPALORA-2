import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ media: data || [] })
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await uploadToCloudinary(buffer, 'soulofnepal/articles')

    // Save to media table in Supabase
    try {
      await supabase.from('media').insert({
        cloudinary_public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
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
