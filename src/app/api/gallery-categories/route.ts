import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createPublicClient } from '@/lib/supabase/server'
import { GalleryCategoryRecord } from '@/types/database'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const DEFAULT_CATEGORIES: Array<Omit<GalleryCategoryRecord, 'id' | 'created_at' | 'updated_at'>> = [
  {
    name: 'Mountains & Landscapes',
    slug: 'mountains-landscapes',
    description: 'Himalayan peaks, high passes, glacial valleys, and dramatic alpine scenery.',
    display_order: 1,
    is_active: true,
  },
  {
    name: 'Culture & Heritage',
    slug: 'culture-heritage',
    description: 'Ancient Durbar squares, sacred temples, Newari architecture, and historical monuments.',
    display_order: 2,
    is_active: true,
  },
  {
    name: 'Food & Culinary',
    slug: 'food-culinary',
    description: 'Authentic Nepali dishes, street food, dal bhat, momos, local teas, and Himalayan spices.',
    display_order: 3,
    is_active: true,
  },
  {
    name: 'People & Daily Life',
    slug: 'people-life',
    description: 'Portraits of mountain communities, monks, artisans, and everyday life across Nepal.',
    display_order: 4,
    is_active: true,
  },
  {
    name: 'Monasteries & Sacred Sites',
    slug: 'monasteries-sacred-sites',
    description: 'Buddhism, prayer flags, high-altitude gompas, and spiritual sanctuaries.',
    display_order: 5,
    is_active: true,
  },
  {
    name: 'Festivals & Celebrations',
    slug: 'festivals-celebrations',
    description: 'Dashain, Tihar, Holi, Indra Jatra, Mani Rimdu, and vibrant cultural rituals.',
    display_order: 6,
    is_active: true,
  },
  {
    name: 'Wildlife & Nature',
    slug: 'wildlife-nature',
    description: 'National parks, snow leopards, one-horned rhinos, rhododendron forests, and birdlife.',
    display_order: 7,
    is_active: true,
  },
  {
    name: 'Trekking & Adventure',
    slug: 'trekking-adventure',
    description: 'Trail action, suspension bridges, base camps, rafting, and expedition moments.',
    display_order: 8,
    is_active: true,
  },
]

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export async function GET() {
  try {
    const supabase = createPublicClient()
    const { data: existingData, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('display_order', { ascending: true })

    let data = existingData

    // If table exists but is empty, try seeding it directly
    if (!error && Array.isArray(data) && data.length === 0) {
      try {
        const serverClient = await createClient()
        const { data: seeded } = await serverClient
          .from('gallery_categories')
          .insert(DEFAULT_CATEGORIES)
          .select('*')
          .order('display_order', { ascending: true })

        if (seeded && seeded.length > 0) {
          data = seeded
        }
      } catch (seedErr) {
        console.warn('Auto-seed notice:', seedErr)
      }
    }

    if (error || !data || data.length === 0) {
      // Return default list with genuine UUIDs so editing / toggling never throws UUID format errors
      const fallbackList: GalleryCategoryRecord[] = DEFAULT_CATEGORIES.map((cat) => ({
        id: randomUUID(),
        ...cat,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      return NextResponse.json({ success: true, categories: fallbackList })
    }

    return NextResponse.json({ success: true, categories: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const name = (body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 })
    }

    const slug = (body.slug || generateSlug(name)).trim()
    const description = (body.description || '').trim() || null
    const display_order = Number(body.display_order) || 1
    const is_active = body.is_active !== undefined ? Boolean(body.is_active) : true

    // Check if category exists by slug or name
    const { data: existing } = await supabase
      .from('gallery_categories')
      .select('id')
      .or(`slug.eq.${slug},name.ilike.${name}`)
      .limit(1)
      .maybeSingle()

    let result
    if (existing?.id) {
      // Update existing
      result = await supabase
        .from('gallery_categories')
        .update({
          name,
          slug,
          description,
          display_order,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('gallery_categories')
        .insert({
          name,
          slug,
          description,
          display_order,
          is_active,
        })
        .select()
        .single()
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    try {
      revalidatePath('/gallery')
      revalidatePath('/staff/categories')
      revalidatePath('/staff/galleries')
    } catch (e) {
      console.warn('Revalidation notice:', e)
    }

    return NextResponse.json({ success: true, category: result.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save category' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    // 1. Batch Reorder
    if (Array.isArray(body.reorder)) {
      const updates = body.reorder.map((item: { id: string; slug?: string; display_order: number }) => {
        if (item.id && isValidUUID(item.id)) {
          return supabase
            .from('gallery_categories')
            .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
            .eq('id', item.id)
        } else if (item.slug) {
          return supabase
            .from('gallery_categories')
            .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
            .eq('slug', item.slug)
        }
        return Promise.resolve()
      })
      await Promise.all(updates)

      try {
        revalidatePath('/gallery')
        revalidatePath('/staff/categories')
        revalidatePath('/staff/galleries')
      } catch (e) {
        console.warn('Revalidation notice:', e)
      }

      return NextResponse.json({ success: true, message: 'Categories reordered successfully' })
    }

    // 2. Single Category Update
    const { id, created_at: _, ...updateData } = body
    const name = updateData.name ? updateData.name.trim() : undefined
    const slug = updateData.slug ? updateData.slug.trim() : name ? generateSlug(name) : undefined
    const description = updateData.description !== undefined ? (updateData.description || '').trim() || null : undefined
    const display_order = updateData.display_order !== undefined ? Number(updateData.display_order) : undefined
    const is_active = updateData.is_active !== undefined ? Boolean(updateData.is_active) : undefined

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (name !== undefined) payload.name = name
    if (slug !== undefined) payload.slug = slug
    if (description !== undefined) payload.description = description
    if (display_order !== undefined) payload.display_order = display_order
    if (is_active !== undefined) payload.is_active = is_active

    let result
    if (id && isValidUUID(id)) {
      result = await supabase
        .from('gallery_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    } else if (slug || name) {
      // Upsert by slug or update matching slug
      const targetSlug = slug || generateSlug(name || '')
      result = await supabase
        .from('gallery_categories')
        .upsert(
          {
            name: name || targetSlug,
            slug: targetSlug,
            description: description || null,
            display_order: display_order || 1,
            is_active: is_active !== undefined ? is_active : true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )
        .select()
        .single()
    } else {
      return NextResponse.json({ error: 'Valid category ID, slug, or name is required for update.' }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    try {
      revalidatePath('/gallery')
      revalidatePath('/staff/categories')
      revalidatePath('/staff/galleries')
    } catch (e) {
      console.warn('Revalidation notice:', e)
    }

    return NextResponse.json({ success: true, category: result.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (!id && !slug) {
      return NextResponse.json({ error: 'Category ID or slug is required' }, { status: 400 })
    }

    let error
    if (id && isValidUUID(id)) {
      const res = await supabase.from('gallery_categories').delete().eq('id', id)
      error = res.error
    } else if (slug) {
      const res = await supabase.from('gallery_categories').delete().eq('slug', slug)
      error = res.error
    } else if (id) {
      // If non-UUID ID was passed (e.g. from fallback), try deleting by slug or fallback
      const res = await supabase.from('gallery_categories').delete().eq('slug', id)
      error = res.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      revalidatePath('/gallery')
      revalidatePath('/staff/categories')
      revalidatePath('/staff/galleries')
    } catch (e) {
      console.warn('Revalidation notice:', e)
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete category' }, { status: 500 })
  }
}
