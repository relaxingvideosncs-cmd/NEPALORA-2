import { createClient } from '@/lib/supabase/server'
import { ArticleJSON, ArticleRecord } from '@/types/article'

export async function saveArticle(
  articleData: ArticleJSON,
  status: 'draft' | 'published' | 'archived' = 'draft'
): Promise<{ success: boolean; article?: any; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Resolve Category ID from Category Slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', articleData.category)
      .single()

    if (catError || !category) {
      return { success: false, error: `Invalid category slug: ${articleData.category}` }
    }

    // 2. Prepare payload for articles table
    const articlePayload = {
      title: articleData.title,
      slug: articleData.slug,
      excerpt: articleData.excerpt,
      category_id: category.id,
      content_json: articleData,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      seo_title: articleData.title,
      seo_description: articleData.excerpt,
      updated_at: new Date().toISOString(),
    }

    const { data: insertedArticle, error: articleError } = await supabase
      .from('articles')
      .upsert(articlePayload, { onConflict: 'slug' })
      .select()
      .single()

    if (articleError) {
      return { success: false, error: articleError.message }
    }

    // 3. Process Tags if provided
    if (articleData.tags && articleData.tags.length > 0 && insertedArticle?.id) {
      for (const tagName of articleData.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const { data: tagRecord } = await supabase
          .from('tags')
          .upsert({ name: tagName, slug: tagSlug }, { onConflict: 'slug' })
          .select('id')
          .single()

        if (tagRecord?.id) {
          await supabase
            .from('article_tags')
            .upsert({ article_id: insertedArticle.id, tag_id: tagRecord.id })
        }
      }
    }

    return { success: true, article: insertedArticle }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown database error' }
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleRecord | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
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
    const supabase = await createClient()
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
    const supabase = await createClient()
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
    const supabase = await createClient()

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
    const supabase = await createClient()
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
