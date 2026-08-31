import { NextRequest, NextResponse } from 'next/server'
import { saveArticle } from '@/lib/article/service'
import { validateArticleJSON } from '@/lib/validation/articleSchema'
import { safeParseArticleJSON } from '@/lib/validation/cleanJSON'
import { createClient } from '@/lib/supabase/server'
import { deleteFromCloudinary } from '@/lib/cloudinary/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content_json,
          status,
          updated_at,
          published_at,
          category:categories(name, slug)
        `)
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }

      return NextResponse.json({ article: data })
    }

    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        status,
        updated_at,
        published_at,
        category:categories(name, slug)
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ articles: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { article, status } = body

    if (!article) {
      return NextResponse.json({ error: 'Missing article payload' }, { status: 400 })
    }

    let articlePayload = article
    if (typeof article === 'string') {
      const parsed = safeParseArticleJSON(article)
      if (!parsed.success || !parsed.data) {
        return NextResponse.json({ error: parsed.error || 'Invalid JSON syntax' }, { status: 400 })
      }
      articlePayload = parsed.data
    }

    const validation = validateArticleJSON(articlePayload)
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { error: 'Invalid article schema', errors: validation.errors },
        { status: 422 }
      )
    }

    const result = await saveArticle(validation.data, status || 'draft')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.article })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    // 1. Fetch article details to extract any Cloudinary images
    const { data: article } = await supabase
      .from('articles')
      .select('content_json, featured_image_url, og_image_url')
      .eq('id', id)
      .single()

    // 2. Delete from Supabase
    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Delete associated Cloudinary images
    if (article) {
      const imagesToDelete: string[] = []
      if (article.featured_image_url) imagesToDelete.push(article.featured_image_url)
      if (article.og_image_url) imagesToDelete.push(article.og_image_url)

      // Search through content_json blocks
      if (article.content_json && typeof article.content_json === 'object') {
        const jsonStr = JSON.stringify(article.content_json)
        const matches = jsonStr.match(/https:\/\/res\.cloudinary\.com\/[^\s"']+/g)
        if (matches) {
          imagesToDelete.push(...matches)
        }
      }

      // Delete in parallel
      const uniqueImages = Array.from(new Set(imagesToDelete))
      await Promise.all(uniqueImages.map((imgUrl) => deleteFromCloudinary(imgUrl)))
    }

    return NextResponse.json({ success: true, message: 'Deleted article and cleaned Cloudinary assets' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
