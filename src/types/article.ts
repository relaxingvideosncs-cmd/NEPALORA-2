export type BlockType = 'paragraph' | 'heading' | 'list' | 'quote' | 'image'

export interface InlineSpan {
  text: string
  bold?: boolean
  italic?: boolean
  link?: string
}

export interface ParagraphBlock {
  type: 'paragraph'
  text?: string
  content?: InlineSpan[]
}

export interface HeadingBlock {
  type: 'heading'
  level: 2 | 3 | 4
  text: string
}

export interface ListBlock {
  type: 'list'
  style: 'bullet' | 'numbered'
  items: (string | InlineSpan[])[]
}

export interface QuoteBlock {
  type: 'quote'
  text: string
  author?: string
}

export interface ImageBlock {
  type: 'image'
  src: string
  alt?: string
  title?: string
  caption?: string
  credit?: string
  alignment?: 'left' | 'center' | 'right'
}

export type ArticleBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | ImageBlock

export interface ArticleJSON {
  title: string
  slug: string
  category: string
  excerpt: string
  author?: string
  tags?: string[]
  featured_image?: {
    src: string
    alt?: string
    title?: string
    caption?: string
    credit?: string
  }
  blocks: ArticleBlock[]
}

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface ArticleRecord {
  id: string
  title: string
  slug: string
  excerpt: string
  category_id: string
  content_json: ArticleJSON
  featured_image_id?: string | null
  author_id?: string | null
  status: ArticleStatus
  published_at?: string | null
  created_at: string
  updated_at: string
  seo_title?: string | null
  seo_description?: string | null
  canonical_url?: string | null
  is_featured: boolean
  view_count: number
  // Joins
  category?: {
    id: string
    name: string
    slug: string
  }
  tags?: {
    id: string
    name: string
    slug: string
  }[]
}
