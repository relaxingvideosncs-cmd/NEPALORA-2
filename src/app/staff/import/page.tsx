'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { validateArticleJSON, ValidationError } from '@/lib/validation/articleSchema'
import { safeParseArticleJSON } from '@/lib/validation/cleanJSON'
import { ArticleJSON, ArticleBlock, BlockType } from '@/types/article'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  Eye,
  FileCode,
  Save,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Plus,
  HelpCircle,
  Image as ImageIcon,
  Edit3,
  X,
  RefreshCw,
  ExternalLink,
  Sliders,
} from 'lucide-react'

const SAMPLE_TEMPLATE: ArticleJSON = {
  title: 'Complete Himalayan Trekking Guide',
  slug: 'complete-himalayan-trekking-guide',
  category: 'trekking-adventure',
  excerpt: 'A practical, structured guide to planning, packing, and preparing for high-altitude treks in Nepal.',
  author: 'Nepalora Editorial',
  tags: ['trekking', 'nepal', 'himalayas', 'safety'],
  blocks: [
    {
      type: 'paragraph',
      text: 'Nepal offers some of the most spectacular mountain trails on Earth. Proper physical preparation, gear selection, and acclimatization pacing are essential for a safe journey.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Essential Preparation Checkpoints',
    },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Secure required TIMS card and national park entry permits in advance.',
        'Follow a gradual ascent schedule to allow natural acclimatization.',
        'Pack multi-layered moisture-wicking apparel and reliable trekking boots.',
      ],
    },
    {
      type: 'quote',
      text: 'In the high Himalayas, patience and hydration are your greatest allies against altitude sickness.',
      author: 'Senior Himalayan Guide',
    },
  ],
}

const MASTER_AI_SYSTEM_PROMPT = `You are the Nepalora Publishing AI.
Your job is to transform any article draft into clean, valid JSON for the Nepalora platform.

CRITICAL FORMATTING REQUIREMENT:
- Output MUST be pure valid RFC 8259 JSON ONLY.
- Start directly with { and end with }.
- NEVER wrap in markdown code blocks like \`\`\`json ... \`\`\`.
- NEVER include greeting, introductory, or concluding commentary.
- NEVER use smart/curly quotes (“ ” ‘ ’). Always use standard ASCII double quotes (").
- NEVER include trailing commas after the last item in an array or object.

JSON SCHEMA STRUCTURE:
{
  "title": "Clear, engaging SEO article title",
  "slug": "lowercase-hyphen-separated-slug",
  "category": "trekking-adventure",
  "excerpt": "A concise 1-2 sentence compelling summary of the guide.",
  "author": "Nepalora Editorial",
  "tags": ["nepal", "himalayas", "trekking", "guide"],
  "featured_image": {
    "src": "https://res.cloudinary.com/...",
    "alt": "Photo description",
    "caption": "Photo caption",
    "credit": "Photographer"
  },
  "blocks": [
    {
      "type": "paragraph",
      "text": "Detailed paragraph text..."
    },
    {
      "type": "heading",
      "level": 2,
      "text": "Section Heading"
    },
    {
      "type": "list",
      "style": "bullet",
      "items": [
        "First practical tip or checklist item",
        "Second practical tip or checklist item"
      ]
    },
    {
      "type": "quote",
      "text": "Insightful quotation or traveler advice.",
      "author": "Local Guide"
    },
    {
      "type": "image",
      "src": "https://res.cloudinary.com/...",
      "alt": "Image description",
      "caption": "Image caption",
      "credit": "Photographer"
    }
  ]
}

STRICT SCHEMA RULES:
1. "category" MUST be exactly one of:
   - "prepare-for-nepal" (visas, packing, flight navigation, currency, safety, cultural etiquette)
   - "trekking-adventure" (Everest, Annapurna, Langtang, routes, altitude acclimatization, permits)
   - "recovery-healing" (post-trek physical recovery, yoga, meditation, sound healing, Ayurveda)
2. In "heading" blocks, "level" MUST be 2, 3, or 4 only (NEVER level 1; the article title is H1).
3. In "list" blocks, "style" MUST be "bullet" or "numbered".
4. "tags" must be an array of 3 to 6 lowercase keyword strings.
5. Format every section into clear, well-structured blocks (break large chunks into paragraphs, H2/H3 subheadings, bullet lists, and image blocks).`

const CATEGORY_OPTIONS = [
  { id: 'prepare-for-nepal', name: 'Prepare for Nepal', desc: 'Visas, packing, etiquette & safety' },
  { id: 'trekking-adventure', name: 'Trekking & Adventure', desc: 'Himalayan routes, permits & mountains' },
  { id: 'recovery-healing', name: 'Recovery & Healing', desc: 'Wellness, yoga, sound healing & retreats' },
]

function JSONImporterContent() {
  const searchParams = useSearchParams()
  const editSlug = searchParams.get('edit')

  const [activeTab, setActiveTab] = useState<'importer' | 'prompt-generator' | 'docs'>('importer')
  const [jsonInput, setJsonInput] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [parsedArticle, setParsedArticle] = useState<ArticleJSON | null>(null)
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('raw')
  const [isSaving, setIsSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [showMetadataDrawer, setShowMetadataDrawer] = useState(false)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
    slug?: string
    status?: string
  } | null>(null)

  // AI Prompt Generator state
  const [rawArticleDraft, setRawArticleDraft] = useState('')
  const [targetCategory, setTargetCategory] = useState<'prepare-for-nepal' | 'trekking-adventure' | 'recovery-healing'>('trekking-adventure')
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null)

  // Block Insert Modal state
  const [insertModalOpen, setInsertModalOpen] = useState(false)
  const [targetInsertIndex, setTargetInsertIndex] = useState<number>(0)
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType>('image')

  // Block creation fields
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [newImageSrc, setNewImageSrc] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')
  const [newImageTitle, setNewImageTitle] = useState('')
  const [newImageCaption, setNewImageCaption] = useState('')
  const [newImageCredit, setNewImageCredit] = useState('')
  const [newImageAlignment, setNewImageAlignment] = useState<'left' | 'center' | 'right'>('center')
  const [newHeadingText, setNewHeadingText] = useState('')
  const [newHeadingLevel, setNewHeadingLevel] = useState<2 | 3 | 4>(2)
  const [newParagraphText, setNewParagraphText] = useState('')
  const [newListStyle, setNewListStyle] = useState<'bullet' | 'numbered'>('bullet')
  const [newListItems, setNewListItems] = useState('')
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('')

  // Cover Image uploader state
  const [uploadingCover, setUploadingCover] = useState(false)

  // If ?edit=slug is in the URL, automatically load and display that article in the live editor
  useEffect(() => {
    if (!editSlug) return

    const loadArticleToEdit = async () => {
      setLoadingEdit(true)
      try {
        const res = await fetch(`/api/articles?slug=${encodeURIComponent(editSlug)}`)
        const data = await res.json()

        if (res.ok && data.article?.content_json) {
          const article = data.article.content_json as ArticleJSON
          setParsedArticle(article)
          setJsonInput(JSON.stringify(article, null, 2))
          setValidationErrors([])
          setViewMode('preview') // Immediately open in live visual editor
          setNotice({
            type: 'success',
            message: `Loaded "${article.title}" into the live visual editor.`,
          })
        } else {
          setNotice({ type: 'error', message: data.error || 'Failed to load article for editing' })
        }
      } catch (err: any) {
        setNotice({ type: 'error', message: err.message || 'Network error loading article' })
      } finally {
        setLoadingEdit(false)
      }
    }

    loadArticleToEdit()
  }, [editSlug])

  // 1-Step Preview & Edit Handler
  const handlePreviewAndEdit = () => {
    if (!jsonInput.trim()) {
      setValidationErrors([{ path: 'Input', message: 'Please paste your Article JSON into the editor.' }])
      return
    }

    const parseResult = safeParseArticleJSON(jsonInput)

    if (!parseResult.success || !parseResult.data) {
      setValidationErrors([
        {
          path: 'Syntax',
          message: parseResult.error || 'Invalid JSON syntax. Please check for missing braces or quotes.',
        },
      ])
      return
    }

    const result = validateArticleJSON(parseResult.data)

    if (result.isValid && result.data) {
      setValidationErrors([])
      setParsedArticle(result.data)
      setJsonInput(JSON.stringify(result.data, null, 2))
      setViewMode('preview') // 1-Step switch directly to live visual editor
    } else {
      setValidationErrors(result.errors)
    }
  }

  const handleLoadSample = () => {
    const formatted = JSON.stringify(SAMPLE_TEMPLATE, null, 2)
    setJsonInput(formatted)
    setParsedArticle(SAMPLE_TEMPLATE)
    setValidationErrors([])
  }

  const handleCategoryChange = (newCat: string) => {
    if (!parsedArticle) return
    const updated: ArticleJSON = { ...parsedArticle, category: newCat as any }
    setParsedArticle(updated)
    setJsonInput(JSON.stringify(updated, null, 2))
  }

  const handleOpenInsertModal = (index: number) => {
    setTargetInsertIndex(index)
    setInsertModalOpen(true)
    setImageUploadError(null)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !parsedArticle) return

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `${parsedArticle.title} - Cover`)
      formData.append('folder', 'nepalora/articles')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')

      const updatedArticle: ArticleJSON = {
        ...parsedArticle,
        featured_image: {
          src: data.data.secure_url,
          alt: parsedArticle.title,
          caption: '',
          credit: '',
        },
      }
      setParsedArticle(updatedArticle)
      setJsonInput(JSON.stringify(updatedArticle, null, 2))
      setNotice({ type: 'success', message: 'Cover image updated successfully.' })
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to upload cover image' })
    } finally {
      setUploadingCover(false)
    }
  }

  const handleFileUploadToCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setImageUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt_text', newImageAlt)
      formData.append('title', newImageTitle)
      formData.append('caption', newImageCaption)
      formData.append('credit', newImageCredit)
      formData.append('folder', 'nepalora/articles')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setNewImageSrc(data.data.secure_url)
    } catch (err: any) {
      setImageUploadError(err.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleInsertBlockSubmit = () => {
    if (!parsedArticle) return

    let newBlock: ArticleBlock | null = null

    if (selectedBlockType === 'image') {
      if (!newImageSrc) return
      newBlock = {
        type: 'image',
        src: newImageSrc,
        alt: newImageAlt || undefined,
        title: newImageTitle || undefined,
        caption: newImageCaption || undefined,
        credit: newImageCredit || undefined,
        alignment: newImageAlignment,
      }
    } else if (selectedBlockType === 'heading') {
      if (!newHeadingText) return
      newBlock = {
        type: 'heading',
        level: newHeadingLevel,
        text: newHeadingText,
      }
    } else if (selectedBlockType === 'paragraph') {
      if (!newParagraphText) return
      newBlock = {
        type: 'paragraph',
        text: newParagraphText,
      }
    } else if (selectedBlockType === 'list') {
      const items = newListItems
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      if (items.length === 0) return
      newBlock = {
        type: 'list',
        style: newListStyle,
        items,
      }
    } else if (selectedBlockType === 'quote') {
      if (!newQuoteText) return
      newBlock = {
        type: 'quote',
        text: newQuoteText,
        author: newQuoteAuthor || undefined,
      }
    }

    if (newBlock) {
      const newBlocks = [...parsedArticle.blocks]
      newBlocks.splice(targetInsertIndex + 1, 0, newBlock)
      const updatedArticle = { ...parsedArticle, blocks: newBlocks }
      setParsedArticle(updatedArticle)
      setJsonInput(JSON.stringify(updatedArticle, null, 2))

      // Reset form
      setNewImageSrc('')
      setNewImageAlt('')
      setNewImageTitle('')
      setNewImageCaption('')
      setNewImageCredit('')
      setNewHeadingText('')
      setNewParagraphText('')
      setNewListItems('')
      setNewQuoteText('')
      setNewQuoteAuthor('')
      setInsertModalOpen(false)
    }
  }

  const handleUpdateBlock = (index: number, updatedBlock: ArticleBlock) => {
    if (!parsedArticle) return
    const updatedBlocks = [...parsedArticle.blocks]
    updatedBlocks[index] = updatedBlock
    const updatedArticle = { ...parsedArticle, blocks: updatedBlocks }
    setParsedArticle(updatedArticle)
    setJsonInput(JSON.stringify(updatedArticle, null, 2))
  }

  const handleDeleteBlock = (index: number) => {
    if (!parsedArticle) return
    const updatedBlocks = parsedArticle.blocks.filter((_, idx) => idx !== index)
    const updatedArticle = { ...parsedArticle, blocks: updatedBlocks }
    setParsedArticle(updatedArticle)
    setJsonInput(JSON.stringify(updatedArticle, null, 2))
  }

  const handleSaveOrPublish = async (status: 'draft' | 'published') => {
    if (!parsedArticle) return
    setIsSaving(true)
    setNotice(null)

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: parsedArticle, status }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save article')
      }

      setNotice({
        type: 'success',
        message:
          status === 'published'
            ? `Article "${parsedArticle.title}" published live successfully!`
            : `Article saved as draft in database.`,
        slug: parsedArticle.slug,
        status,
      })
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Database error while saving.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const generatedFullPrompt = `${MASTER_AI_SYSTEM_PROMPT}

TARGET PILLAR CATEGORY:
"${targetCategory}"

RAW ARTICLE DRAFT CONTENT TO TRANSFORM:
---
${rawArticleDraft.trim() || '[Paste your raw article draft here]'}
---

Now output ONLY the JSON structure conforming to the schema above:`

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedFullPrompt)
    setCopiedNotice('Master Prompt Copied to Clipboard!')
    setTimeout(() => setCopiedNotice(null), 3000)
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Editorial Studio</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Article Publishing Studio
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Publish structured guides from JSON or edit live guides with visual block controls.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-bg-elevated border border-hairline p-1 rounded-pill text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('importer')}
            className={`px-3.5 py-2 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
              activeTab === 'importer'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs font-bold'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Publishing Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt-generator')}
            className={`px-3.5 py-2 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
              activeTab === 'prompt-generator'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs font-bold'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
            <span>AI Prompt Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-2 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs font-bold'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-ink-tertiary" />
            <span>Schema Docs</span>
          </button>
        </div>
      </div>

      {loadingEdit && (
        <div className="py-8 flex items-center justify-center gap-2 text-ink-secondary text-xs font-semibold bg-accent-blue/5 rounded-2xl border border-accent-blue/20">
          <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
          <span>Loading article from database...</span>
        </div>
      )}

      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>

          {notice.slug && (
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <Link
                href={`/article/${notice.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-colors shadow-xs"
              >
                <span>View Live Guide</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/staff/articles"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill bg-bg border border-hairline text-ink hover:border-hairline-strong text-xs font-bold transition-colors"
              >
                <span>Manage Articles</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: PUBLISHING STUDIO (1-STEP PREVIEW & VISUAL EDITOR) */}
      {activeTab === 'importer' && (
        <div className="space-y-6">
          {/* Top Actions & Mode Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-bg-elevated rounded-2xl border border-hairline shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`px-4 py-2 min-h-[40px] rounded-pill text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                    : 'bg-bg text-ink border border-hairline hover:border-hairline-strong'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON Input</span>
              </button>

              <button
                type="button"
                onClick={handlePreviewAndEdit}
                className={`px-4 py-2 min-h-[40px] rounded-pill text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs ring-2 ring-accent-blue/40'
                    : 'bg-bg text-ink border border-hairline hover:border-hairline-strong'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-accent-blue" />
                <span>Preview & Visual Editor</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!jsonInput.trim() && (
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3.5 py-2 min-h-[40px] bg-bg hover:border-hairline-strong text-ink border border-hairline rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-ink-tertiary" />
                  <span>Load Sample</span>
                </button>
              )}

              {parsedArticle && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSaveOrPublish('draft')}
                    disabled={isSaving}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveOrPublish('published')}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Publish Live</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Validation Error Notices */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-accent-red">
                <AlertTriangle className="w-4 h-4 text-accent-red" />
                <span>JSON Validation Issues ({validationErrors.length})</span>
              </div>
              <ul className="text-xs text-accent-red list-disc pl-5 space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>
                    <strong>{err.path}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* MODE A: RAW JSON EDITOR */}
          {viewMode === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink">
                  Paste Article JSON Output:
                </label>
                <button
                  type="button"
                  onClick={handlePreviewAndEdit}
                  className="text-xs text-accent-blue hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Validate & Preview →</span>
                </button>
              </div>

              <textarea
                rows={18}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste your JSON here (e.g. from AI)...\n{\n  "title": "Your Title",\n  "slug": "your-slug",\n  "category": "trekking-adventure",\n  "excerpt": "Short excerpt",\n  "blocks": [...]\n}`}
                className="w-full p-4 font-mono text-xs text-ink bg-bg-elevated rounded-2xl border border-hairline focus:border-hairline-strong focus:outline-none leading-relaxed"
                spellCheck={false}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handlePreviewAndEdit}
                >
                  <Eye className="w-4 h-4 text-accent-blue" />
                  <span>Preview & Edit Guide</span>
                </Button>
              </div>
            </div>
          )}

          {/* MODE B: LIVE VISUAL BLOCK EDITOR */}
          {viewMode === 'preview' && parsedArticle && (
            <div className="space-y-6">
              {/* Category Selector Bar (Select directly when previewing) */}
              <div className="p-4 bg-bg-elevated rounded-2xl border border-hairline shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-accent-blue" />
                    <span className="text-xs font-bold text-ink">Target Content Pillar / Category</span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-tertiary">
                    Selected: /{parsedArticle.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = parsedArticle.category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-xs font-bold'
                            : 'bg-bg text-ink-secondary hover:text-ink border-hairline hover:border-hairline-strong'
                        }`}
                      >
                        <div className="text-xs font-bold">{cat.name}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'opacity-80' : 'text-ink-tertiary'}`}>
                          {cat.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Metadata Drawer Toggle */}
              <div className="p-4 bg-bg-elevated rounded-2xl border border-hairline shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-ink block">Article Details & Cover</span>
                    <span className="text-[11px] text-ink-secondary">
                      Title, Slug, Excerpt, Author, and Featured Banner Photo
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
                    className="text-xs text-accent-blue font-bold hover:underline cursor-pointer"
                  >
                    {showMetadataDrawer ? 'Collapse Details ↑' : 'Edit Metadata & Cover ↓'}
                  </button>
                </div>

                {showMetadataDrawer && (
                  <div className="space-y-4 pt-3 border-t border-hairline text-xs">
                    <div>
                      <label className="block font-semibold text-ink mb-1">Article Title *</label>
                      <input
                        type="text"
                        value={parsedArticle.title}
                        onChange={(e) => {
                          const updated = { ...parsedArticle, title: e.target.value }
                          setParsedArticle(updated)
                          setJsonInput(JSON.stringify(updated, null, 2))
                        }}
                        className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg focus:border-hairline-strong focus:outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-ink mb-1">URL Slug</label>
                        <input
                          type="text"
                          value={parsedArticle.slug}
                          onChange={(e) => {
                            const updated = { ...parsedArticle, slug: e.target.value }
                            setParsedArticle(updated)
                            setJsonInput(JSON.stringify(updated, null, 2))
                          }}
                          className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg font-mono text-[11px] focus:border-hairline-strong focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-ink mb-1">Author Name</label>
                        <input
                          type="text"
                          value={parsedArticle.author || ''}
                          onChange={(e) => {
                            const updated = { ...parsedArticle, author: e.target.value }
                            setParsedArticle(updated)
                            setJsonInput(JSON.stringify(updated, null, 2))
                          }}
                          className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg text-xs focus:border-hairline-strong focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">Excerpt / Summary</label>
                      <textarea
                        rows={2}
                        value={parsedArticle.excerpt || ''}
                        onChange={(e) => {
                          const updated = { ...parsedArticle, excerpt: e.target.value }
                          setParsedArticle(updated)
                          setJsonInput(JSON.stringify(updated, null, 2))
                        }}
                        className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg text-xs focus:border-hairline-strong focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* Cover Photo Management */}
                    <div className="p-3 bg-bg rounded-xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {parsedArticle.featured_image?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={parsedArticle.featured_image.src}
                            alt="Cover"
                            className="w-16 h-12 object-cover rounded-lg border border-hairline"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-bg-elevated text-ink-tertiary flex items-center justify-center border border-hairline">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-ink block">Featured Cover Banner</span>
                          <span className="text-[11px] text-ink-secondary">
                            {parsedArticle.featured_image?.src
                              ? 'Custom cover image attached'
                              : 'Auto-using first image block in article'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="cover-upload"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="cover-upload"
                          className="cursor-pointer px-3.5 py-2 min-h-[38px] bg-bg hover:border-hairline-strong text-ink border border-hairline rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {uploadingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-accent-blue" />
                          )}
                          <span>{uploadingCover ? 'Uploading...' : 'Upload Cover Photo'}</span>
                        </label>
                        {parsedArticle.featured_image?.src && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...parsedArticle, featured_image: undefined }
                              setParsedArticle(updated)
                              setJsonInput(JSON.stringify(updated, null, 2))
                            }}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-ink-tertiary hover:text-accent-red"
                            title="Remove custom cover"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Article Renderer */}
              <div className="bg-bg-elevated border border-hairline rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
                <ArticleRenderer
                  article={parsedArticle}
                  isEditable={true}
                  onInsertBlockAt={handleOpenInsertModal}
                  onUpdateBlock={handleUpdateBlock}
                  onDeleteBlock={handleDeleteBlock}
                />

                {/* Bottom Action Controls */}
                <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className="text-xs text-ink-secondary hover:text-ink font-semibold min-h-[44px] flex items-center cursor-pointer"
                  >
                    ← Back to Raw JSON Editor
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => handleSaveOrPublish('draft')}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4" />
                      <span>Save as Draft</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => handleSaveOrPublish('published')}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Publish Live</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI PROMPT GENERATOR */}
      {activeTab === 'prompt-generator' && (
        <div className="space-y-6 bg-bg-elevated border border-hairline rounded-2xl p-4 sm:p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone="blue">AI Draft Transformation Engine</Badge>
            </div>
            <h2 className="font-display text-xl font-bold text-ink">
              Generate Article JSON with AI
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Paste any article draft or guide below, select target pillar, and copy the master prompt into ChatGPT, Claude, or Gemini.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                1. Select Target Category Pillar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTargetCategory(cat.id as any)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      targetCategory === cat.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-xs font-bold'
                        : 'bg-bg text-ink-secondary hover:text-ink border-hairline hover:border-hairline-strong'
                    }`}
                  >
                    <div className="text-xs font-bold">{cat.name}</div>
                    <div className="text-[10px] opacity-80">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                2. Paste Raw Article Draft / Text:
              </label>
              <textarea
                rows={8}
                value={rawArticleDraft}
                onChange={(e) => setRawArticleDraft(e.target.value)}
                placeholder="Paste your raw text, bullet points, travel itinerary, or blog draft here..."
                className="w-full p-4 text-xs text-ink bg-bg rounded-xl border border-hairline focus:border-hairline-strong focus:outline-none leading-relaxed font-sans"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink">
                  3. Generated Master AI Prompt:
                </label>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-pill text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {copiedNotice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNotice || 'Copy Full Prompt'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={generatedFullPrompt}
                className="w-full p-4 font-mono text-[11px] text-ink bg-bg rounded-xl border border-hairline select-all leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA DOCS */}
      {activeTab === 'docs' && (
        <div className="space-y-6 bg-bg-elevated border border-hairline rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="border-b border-hairline pb-4">
            <h2 className="font-display text-xl font-bold text-ink">
              Nepalora Article JSON Schema Reference
            </h2>
            <p className="text-xs text-ink-secondary mt-1">
              Every article is rendered from RFC 8259 compliant JSON.
            </p>
          </div>

          <div className="space-y-4 text-xs text-ink-secondary leading-relaxed">
            <div className="p-4 bg-bg rounded-xl border border-hairline space-y-2">
              <h3 className="font-bold text-ink text-sm">Top-Level Attributes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="font-mono text-ink font-semibold">title</code> (string): Full guide title.</li>
                <li><code className="font-mono text-ink font-semibold">slug</code> (string): URL path identifier (e.g. <code className="font-mono">everest-base-camp-guide</code>).</li>
                <li><code className="font-mono text-ink font-semibold">category</code> (string): One of <code className="font-mono">prepare-for-nepal</code>, <code className="font-mono">trekking-adventure</code>, or <code className="font-mono">recovery-healing</code>.</li>
                <li><code className="font-mono text-ink font-semibold">excerpt</code> (string): 1-2 sentence compelling summary for search engines and cards.</li>
                <li><code className="font-mono text-ink font-semibold">blocks</code> (array): List of content blocks in presentation order.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Block Insert Modal */}
      {insertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-bg-elevated rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-hairline relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent-blue" />
                <span>Insert New Content Block</span>
              </h3>
              <button
                type="button"
                onClick={() => setInsertModalOpen(false)}
                className="p-1 rounded-lg hover:bg-bg text-ink-tertiary hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Block Type Selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(['image', 'heading', 'paragraph', 'list', 'quote'] as BlockType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedBlockType(type)}
                  className={`px-3.5 py-1.5 rounded-pill font-bold capitalize transition-all cursor-pointer ${
                    selectedBlockType === type
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                      : 'bg-bg text-ink-secondary hover:text-ink border border-hairline'
                  }`}
                >
                  +{type}
                </button>
              ))}
            </div>

            {/* Form Fields Based on Block Type */}
            <div className="space-y-4 text-xs">
              {selectedBlockType === 'image' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Image Source (URL or Upload) *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={newImageSrc}
                        onChange={(e) => setNewImageSrc(e.target.value)}
                        placeholder="Paste image URL..."
                        className="flex-1 p-2.5 border border-hairline rounded-xl text-ink bg-bg font-mono text-[11px] focus:outline-none"
                      />
                      <input
                        type="file"
                        id="block-image-upload"
                        accept="image/*"
                        onChange={handleFileUploadToCloudinary}
                        className="hidden"
                      />
                      <label
                        htmlFor="block-image-upload"
                        className="cursor-pointer px-3 py-2.5 bg-bg hover:border-hairline-strong border border-hairline text-ink rounded-xl font-semibold flex items-center gap-1"
                      >
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Upload</span>
                      </label>
                    </div>
                    {imageUploadError && (
                      <p className="text-accent-red text-[11px] mt-1">{imageUploadError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink mb-1">Alt Text</label>
                      <input
                        type="text"
                        value={newImageAlt}
                        onChange={(e) => setNewImageAlt(e.target.value)}
                        placeholder="Image description"
                        className="w-full p-2 border border-hairline rounded-lg text-ink bg-bg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-ink mb-1">Caption</label>
                      <input
                        type="text"
                        value={newImageCaption}
                        onChange={(e) => setNewImageCaption(e.target.value)}
                        placeholder="Caption under photo"
                        className="w-full p-2 border border-hairline rounded-lg text-ink bg-bg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedBlockType === 'heading' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Heading Text *</label>
                    <input
                      type="text"
                      value={newHeadingText}
                      onChange={(e) => setNewHeadingText(e.target.value)}
                      placeholder="Section title..."
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-ink mb-1">Level</label>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setNewHeadingLevel(lvl as any)}
                          className={`px-4 py-1.5 rounded-pill font-bold ${
                            newHeadingLevel === lvl
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                              : 'bg-bg text-ink border border-hairline'
                          }`}
                        >
                          H{lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedBlockType === 'paragraph' && (
                <div>
                  <label className="block font-semibold text-ink mb-1">Paragraph Text *</label>
                  <textarea
                    rows={4}
                    value={newParagraphText}
                    onChange={(e) => setNewParagraphText(e.target.value)}
                    placeholder="Write detailed paragraph content..."
                    className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg leading-relaxed"
                  />
                </div>
              )}

              {selectedBlockType === 'list' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">List Items (One per line) *</label>
                    <textarea
                      rows={4}
                      value={newListItems}
                      onChange={(e) => setNewListItems(e.target.value)}
                      placeholder="First checklist item&#10;Second checklist item&#10;Third checklist item"
                      className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewListStyle('bullet')}
                      className={`px-3.5 py-1.5 rounded-pill font-semibold ${
                        newListStyle === 'bullet'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-bg text-ink border border-hairline'
                      }`}
                    >
                      Bullet List
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewListStyle('numbered')}
                      className={`px-3.5 py-1.5 rounded-pill font-semibold ${
                        newListStyle === 'numbered'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-bg text-ink border border-hairline'
                      }`}
                    >
                      Numbered List
                    </button>
                  </div>
                </div>
              )}

              {selectedBlockType === 'quote' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Quote Text *</label>
                    <textarea
                      rows={3}
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      placeholder="Quotation or key takeaway..."
                      className="w-full p-3 border border-hairline rounded-xl text-ink bg-bg leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-ink mb-1">Quote Author (Optional)</label>
                    <input
                      type="text"
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      placeholder="e.g. Local Sherpa Guide"
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setInsertModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleInsertBlockSubmit}
                >
                  Insert Block
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffJSONImporterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
      }
    >
      <JSONImporterContent />
    </Suspense>
  )
}
