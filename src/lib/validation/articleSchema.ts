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

export function validateArticleJSON(input: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: [{ path: 'root', message: 'Article must be a valid JSON object.' }],
    }
  }

  const data = input as Partial<ArticleJSON>

  // Required top-level fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push({ path: 'title', message: 'Missing or empty "title" field.' })
  }

  if (!data.slug || typeof data.slug !== 'string' || data.slug.trim() === '') {
    errors.push({ path: 'slug', message: 'Missing or empty "slug" field.' })
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({ path: 'slug', message: '"slug" must only contain lowercase alphanumeric characters and hyphens.' })
  }

  if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
    errors.push({ path: 'category', message: 'Missing or empty "category" field.' })
  }

  if (!data.excerpt || typeof data.excerpt !== 'string' || data.excerpt.trim() === '') {
    errors.push({ path: 'excerpt', message: 'Missing or empty "excerpt" field.' })
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push({ path: 'tags', message: '"tags" must be an array of strings.' })
    } else {
      data.tags.forEach((tag, idx) => {
        if (typeof tag !== 'string') {
          errors.push({ path: `tags[${idx}]`, message: 'Tag item must be a string.' })
        }
      })
    }
  }

  if (!data.blocks || !Array.isArray(data.blocks)) {
    errors.push({ path: 'blocks', message: 'Missing or invalid "blocks" array.' })
    return { isValid: errors.length === 0, errors, data: errors.length === 0 ? (data as ArticleJSON) : undefined }
  }

  const allowedBlockTypes: BlockType[] = ['paragraph', 'heading', 'list', 'quote', 'image']

  data.blocks.forEach((block: any, index: number) => {
    const blockPath = `blocks[${index}]`

    if (!block || typeof block !== 'object') {
      errors.push({ path: blockPath, message: 'Block must be an object.' })
      return
    }

    if (!block.type || typeof block.type !== 'string') {
      errors.push({ path: `${blockPath}.type`, message: 'Block is missing "type".' })
      return
    }

    if (!allowedBlockTypes.includes(block.type)) {
      errors.push({
        path: `${blockPath}.type`,
        message: `"type" is not recognized: "${block.type}". Allowed values: ${allowedBlockTypes.join(', ')}`,
      })
      return
    }

    switch (block.type) {
      case 'paragraph': {
        if (!block.text && !block.content) {
          errors.push({
            path: blockPath,
            message: 'Paragraph block must contain either "text" string or "content" array of formatted spans.',
          })
        }
        if (block.content && !Array.isArray(block.content)) {
          errors.push({ path: `${blockPath}.content`, message: '"content" must be an array of spans.' })
        }
        break
      }
      case 'heading': {
        if (!block.text || typeof block.text !== 'string') {
          errors.push({ path: `${blockPath}.text`, message: 'Heading block requires a "text" string.' })
        }
        if (![2, 3, 4].includes(block.level)) {
          errors.push({
            path: `${blockPath}.level`,
            message: `Heading level must be 2, 3, or 4. Received: ${block.level}. H1 is reserved for the article title.`,
          })
        }
        break
      }
      case 'list': {
        if (!['bullet', 'numbered'].includes(block.style)) {
          errors.push({
            path: `${blockPath}.style`,
            message: `List style must be either "bullet" or "numbered". Received: "${block.style}".`,
          })
        }
        if (!Array.isArray(block.items) || block.items.length === 0) {
          errors.push({ path: `${blockPath}.items`, message: 'List block requires a non-empty "items" array.' })
        }
        break
      }
      case 'quote': {
        if (!block.text || typeof block.text !== 'string') {
          errors.push({ path: `${blockPath}.text`, message: 'Quote block requires a "text" string.' })
        }
        break
      }
      case 'image': {
        if (!block.src || typeof block.src !== 'string' || block.src.trim() === '') {
          errors.push({ path: `${blockPath}.src`, message: 'Image block requires a valid "src" URL.' })
        }
        if (block.alignment && !['left', 'center', 'right'].includes(block.alignment)) {
          errors.push({
            path: `${blockPath}.alignment`,
            message: 'Image alignment must be "left", "center", or "right".',
          })
        }
        break
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (data as ArticleJSON) : undefined,
  }
}
