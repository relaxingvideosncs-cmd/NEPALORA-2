import { createClient, createPublicClient } from '@/lib/supabase/server'
import { ArticleJSON, ArticleRecord } from '@/types/article'

export async function saveArticle(
  articleData: ArticleJSON,
  status: 'draft' | 'published' | 'archived' = 'draft'
): Promise<{ success: boolean; article?: ArticleRecord | null; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Resolve Category ID from Category Slug or Name
    let categoryId: string | null = null
    const cleanCat = (articleData.category || '').trim()
    const catSlug = cleanCat
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Find category by slug or name
    const { data: matchedCategory } = await supabase
      .from('categories')
      .select('id, name, slug')
      .or(`slug.eq.${catSlug || 'general'},slug.eq.${cleanCat},name.ilike.%${cleanCat}%`)
      .limit(1)
      .maybeSingle()

    if (matchedCategory?.id) {
      categoryId = matchedCategory.id
    } else {
      // Fallback to first available category in database
      const { data: firstCat } = await supabase.from('categories').select('id').limit(1).maybeSingle()
      if (firstCat?.id) {
        categoryId = firstCat.id
      } else {
        // Auto-create category if table is empty
        const { data: newCat } = await supabase
          .from('categories')
          .insert({
            name: cleanCat || 'Trekking & Adventure',
            slug: catSlug || 'trekking-adventure',
            description: 'Comprehensive travel and trekking guide for Nepal.',
          })
          .select('id')
          .single()
        categoryId = newCat?.id || null
      }
    }

    if (!categoryId) {
      return { success: false, error: 'Could not associate article with a category in the database.' }
    }

    // 2. Sanitize Slug and Title
    const cleanSlug = (articleData.slug || articleData.title || 'untitled-guide')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const articlePayload: any = {
      title: (articleData.title || 'Untitled Guide').trim(),
      slug: cleanSlug,
      excerpt: (articleData.excerpt || '').trim(),
      category_id: categoryId,
      content_json: {
        ...articleData,
        slug: cleanSlug,
      },
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      seo_title: (articleData.title || '').trim(),
      seo_description: (articleData.excerpt || '').trim(),
      updated_at: new Date().toISOString(),
    }

    const { data: insertedArticle, error: articleError } = await supabase
      .from('articles')
      .upsert(articlePayload, { onConflict: 'slug' })
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        status,
        published_at,
        created_at,
        updated_at,
        category:categories(id, name, slug)
      `)
      .single()

    if (articleError) {
      console.error('Supabase article upsert error:', articleError)
      return { success: false, error: articleError.message }
    }

    // 3. Process Tags if provided (non-blocking)
    if (articleData.tags && Array.isArray(articleData.tags) && articleData.tags.length > 0 && insertedArticle?.id) {
      try {
        for (const tagName of articleData.tags) {
          if (typeof tagName !== 'string' || !tagName.trim()) continue
          const tagSlug = tagName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')

          const { data: tagRecord } = await supabase
            .from('tags')
            .upsert({ name: tagName.trim(), slug: tagSlug }, { onConflict: 'slug' })
            .select('id')
            .single()

          if (tagRecord?.id) {
            await supabase
              .from('article_tags')
              .upsert({ article_id: insertedArticle.id, tag_id: tagRecord.id })
          }
        }
      } catch (tagErr) {
        console.warn('Tag upsert notice (non-fatal):', tagErr)
      }
    }

    return { success: true, article: insertedArticle as unknown as ArticleRecord }
  } catch (err: unknown) {
    console.error('Error saving article to database:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown database error' }
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleRecord | null> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        status,
        published_at,
        created_at,
        updated_at,
        category:categories(id, name, slug)
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) return null
    return data as unknown as ArticleRecord
  } catch {
    return null
  }
}

export async function getAllPublishedArticles() {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        status,
        published_at,
        created_at,
        category:categories(id, name, slug)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('Error fetching all published articles:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('Error querying all published articles:', err)
    return []
  }
}

export async function getPublishedArticlesByCategory(categorySlug: string, limit = 12) {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        status,
        published_at,
        created_at,
        category:categories!inner(id, name, slug)
      `)
      .eq('status', 'published')
      .eq('category.slug', categorySlug)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getSimilarArticles(categorySlug: string, currentSlug: string, limit = 3) {
  try {
    const supabase = createPublicClient()

    // 1. Fetch articles from same category excluding current
    const { data: sameCategory } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        status,
        published_at,
        category:categories!inner(name, slug)
      `)
      .eq('status', 'published')
      .eq('category.slug', categorySlug)
      .neq('slug', currentSlug)
      .order('published_at', { ascending: false })
      .limit(limit)

    let results = sameCategory || []

    // 2. If fewer than limit, backfill with latest articles from other categories
    if (results.length < limit) {
      const remainingLimit = limit - results.length
      const excludedSlugs = [currentSlug, ...results.map((r) => r.slug)]

      const { data: fallbackArticles } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content_json,
          status,
          published_at,
          category:categories(name, slug)
        `)
        .eq('status', 'published')
        .not('slug', 'in', `(${excludedSlugs.join(',')})`)
        .order('published_at', { ascending: false })
        .limit(remainingLimit)

      if (fallbackArticles) {
        results = [...results, ...fallbackArticles]
      }
    }

    return results
  } catch {
    return []
  }
}

export async function searchArticles(query: string) {
  try {
    const supabase = createPublicClient()
    if (!query.trim()) return []

    // Use PostgreSQL full text search vector
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        status,
        published_at,
        category:categories(name, slug)
      `)
      .eq('status', 'published')
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english',
      })
      .limit(20)

    if (error || !data || data.length === 0) {
      // Fallback to title/excerpt ILIKE search if textSearch is unindexed or specific tag lookup
      const { data: fallbackData } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content_json,
          status,
          published_at,
          category:categories(name, slug)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .limit(20)

      return fallbackData || []
    }

    return data
  } catch {
    return []
  }
}
