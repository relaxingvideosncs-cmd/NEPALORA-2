import { ArticleJSON, ArticleBlock, BlockType } from '@/types/article'

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  data?: ArticleJSON
}

function normalizeCategory(cat?: string): string {
  if (!cat) return 'trekking-adventure'
  const lower = cat.toLowerCase().trim()
  if (lower.includes('prepare')) return 'prepare-for-nepal'
  if (lower.includes('trek') || lower.includes('adventure') || lower.includes('mountain')) return 'trekking-adventure'
  if (lower.includes('recover') || lower.includes('heal') || lower.includes('yoga') || lower.includes('wellness')) return 'recovery-healing'
  
  return lower.replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') || 'trekking-adventure'
}

function normalizeSlug(slug?: string, title?: string): string {
  const text = (slug || title || 'untitled-guide').trim()
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-guide'
}

export function validateArticleJSON(input: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: [{ path: 'root', message: 'Article must be a valid JSON object.' }],
    }
  }

  const raw = input as Record<string, any>

  // Required top-level fields
  const title = (raw.title || '').toString().trim()
  if (!title) {
    errors.push({ path: 'title', message: 'Missing or empty "title" field.' })
  }

  const slug = normalizeSlug(raw.slug, title)
  const category = normalizeCategory(raw.category)
  const excerpt = (raw.excerpt || '').toString().trim() || `${title} — A comprehensive guide on Nepalora.`
  const author = (raw.author || 'Nepalora Editorial').toString().trim()

  // Process Tags
  let tags: string[] = []
  if (Array.isArray(raw.tags)) {
    tags = raw.tags
      .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      .filter(Boolean)
  } else if (typeof raw.tags === 'string') {
    tags = raw.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  }
  if (tags.length === 0) {
    tags = ['nepal', 'himalayas', 'travel']
  }

  // Process Blocks
  if (!raw.blocks || !Array.isArray(raw.blocks)) {
    errors.push({ path: 'blocks', message: 'Missing or invalid "blocks" array.' })
    return { isValid: false, errors }
  }

  const allowedBlockTypes: BlockType[] = ['paragraph', 'heading', 'list', 'quote', 'image']
  const cleanBlocks: ArticleBlock[] = []

  raw.blocks.forEach((block: any, index: number) => {
    const blockPath = `blocks[${index}]`

    if (!block || typeof block !== 'object') {
      return
    }

    const type = (block.type || '').toString().toLowerCase().trim() as BlockType

    if (!allowedBlockTypes.includes(type)) {
      errors.push({
        path: `${blockPath}.type`,
        message: `"type" is not recognized: "${block.type}". Allowed values: ${allowedBlockTypes.join(', ')}`,
      })
      return
    }

    switch (type) {
      case 'paragraph': {
        const text = (block.text || '').toString().trim()
        if (text || (Array.isArray(block.content) && block.content.length > 0)) {
          cleanBlocks.push({
            type: 'paragraph',
            text: text || undefined,
            content: Array.isArray(block.content) ? block.content : undefined,
          })
        }
        break
      }
      case 'heading': {
        const text = (block.text || '').toString().trim()
        if (!text) {
          errors.push({ path: `${blockPath}.text`, message: 'Heading block requires a "text" string.' })
          return
        }
        let level = Number(block.level) || 2
        if (level < 2 || level > 4) level = 2
        cleanBlocks.push({
          type: 'heading',
          level: level as 2 | 3 | 4,
          text,
        })
        break
      }
      case 'list': {
        let style = (block.style || 'bullet').toString().toLowerCase().trim()
        if (style === 'unordered' || style !== 'numbered') style = 'bullet'
        let items: string[] = []
        if (Array.isArray(block.items)) {
          items = block.items.map((it: any) => (it ? it.toString().trim() : '')).filter(Boolean)
        }
        if (items.length === 0) {
          errors.push({ path: `${blockPath}.items`, message: 'List block requires a non-empty "items" array.' })
          return
        }
        cleanBlocks.push({
          type: 'list',
          style: style as 'bullet' | 'numbered',
          items,
        })
        break
      }
      case 'quote': {
        const text = (block.text || '').toString().trim()
        if (!text) {
          errors.push({ path: `${blockPath}.text`, message: 'Quote block requires a "text" string.' })
          return
        }
        cleanBlocks.push({
          type: 'quote',
          text,
          author: block.author ? block.author.toString().trim() : undefined,
        })
        break
      }
      case 'image': {
        const src = (block.src || '').toString().trim()
        if (!src) {
          errors.push({ path: `${blockPath}.src`, message: 'Image block requires a valid "src" URL.' })
          return
        }
        let alignment = (block.alignment || 'center').toString().toLowerCase().trim()
        if (!['left', 'center', 'right'].includes(alignment)) alignment = 'center'
        cleanBlocks.push({
          type: 'image',
          src,
          alt: block.alt ? block.alt.toString().trim() : title,
          title: block.title ? block.title.toString().trim() : undefined,
          caption: block.caption ? block.caption.toString().trim() : undefined,
          credit: block.credit ? block.credit.toString().trim() : undefined,
          alignment: alignment as 'left' | 'center' | 'right',
        })
        break
      }
    }
  })

  if (cleanBlocks.length === 0) {
    errors.push({ path: 'blocks', message: 'Article must contain at least one valid content block.' })
  }

  const normalizedArticle: ArticleJSON = {
    title,
    slug,
    category: category as any,
    excerpt,
    author,
    tags,
    featured_image: raw.featured_image
      ? {
          src: (raw.featured_image.src || '').toString().trim(),
          alt: (raw.featured_image.alt || title).toString().trim(),
          caption: raw.featured_image.caption ? raw.featured_image.caption.toString().trim() : undefined,
          credit: raw.featured_image.credit ? raw.featured_image.credit.toString().trim() : undefined,
        }
      : undefined,
    blocks: cleanBlocks,
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? normalizedArticle : undefined,
  }
}
