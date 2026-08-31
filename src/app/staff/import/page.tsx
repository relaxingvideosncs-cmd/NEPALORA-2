'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArticleRenderer } from '@/components/article/ArticleRenderer'
import { validateArticleJSON, ValidationError } from '@/lib/validation/articleSchema'
import { safeParseArticleJSON } from '@/lib/validation/cleanJSON'
import { ArticleJSON, ArticleBlock, BlockType } from '@/types/article'
import { compressImageClient } from '@/lib/cloudinary/clientCompress'
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
    "src": "https://images.unsplash.com/photo-...",
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
      "src": "https://images.unsplash.com/photo-...",
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
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
          setViewMode('preview') // Immediately open in live visual editor!
          setNotice({ type: 'success', message: `Loaded "${article.title}" into the live visual editor.` })
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

    // Auto-clean & format JSON in the editor
    const cleanedJSON = JSON.stringify(parseResult.data, null, 2)
    setJsonInput(cleanedJSON)

    const result = validateArticleJSON(parseResult.data)

    if (result.isValid && result.data) {
      setValidationErrors([])
      setParsedArticle(result.data)
      setViewMode('preview') // 1-Step switch directly to live visual editor!
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
      const compressed = await compressImageClient(file, { maxDimension: 1920 })
      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('title', `${parsedArticle.title} - Cover`)

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
      const optimizedFile = await compressImageClient(file, { maxDimension: 1600 })
      const formData = new FormData()
      formData.append('file', optimizedFile)
      formData.append('alt_text', newImageAlt)
      formData.append('title', newImageTitle)
      formData.append('caption', newImageCaption)
      formData.append('credit', newImageCredit)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload to Cloudinary')
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
      const items = newListItems.split('\n').filter((item) => item.trim() !== '')
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
      const updatedBlocks = [...parsedArticle.blocks]
      updatedBlocks.splice(targetInsertIndex, 0, newBlock)
      const updatedArticle = { ...parsedArticle, blocks: updatedBlocks }
      setParsedArticle(updatedArticle)
      setJsonInput(JSON.stringify(updatedArticle, null, 2))

      // Reset form fields
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
            : `Article saved as draft in library.`,
      })
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Database error while saving.',
      })
    } finally {
      setIsSaving(false)
      setTimeout(() => setNotice(null), 6000)
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
            Publish structured guides from AI JSON or edit live guides with full visual block controls.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-bg-elevated border border-hairline p-1 rounded-pill text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('importer')}
            className={`px-3 py-1.5 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
              activeTab === 'importer' ? 'bg-ink text-bg shadow-xs font-bold' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Publishing Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt-generator')}
            className={`px-3 py-1.5 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
              activeTab === 'prompt-generator' ? 'bg-ink text-bg shadow-xs font-bold' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
            <span>AI Prompt Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-pill flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
              activeTab === 'docs' ? 'bg-ink text-bg shadow-xs font-bold' : 'text-ink-secondary hover:text-ink'
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
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{notice.message}</span>
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
                className={`px-3.5 py-2 min-h-[40px] rounded-pill text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'raw'
                    ? 'bg-ink text-bg shadow-xs'
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
                    ? 'bg-ink text-bg shadow-xs ring-2 ring-accent-blue/40'
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
          {viewMode === 'preview' && (
            <div className="space-y-6">
              {parsedArticle ? (
                <div className="bg-bg-elevated border border-hairline rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
                  {/* Cover Photo Management Bar */}
                  <div className="p-4 bg-bg rounded-xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                        className="cursor-pointer px-3.5 py-2 min-h-[40px] bg-bg hover:border-hairline-strong text-ink border border-hairline rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {uploadingCover ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-blue" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-accent-blue" />
                        )}
                        <span>{uploadingCover ? 'Compressing...' : 'Upload Cover Photo'}</span>
                      </label>
                      {parsedArticle.featured_image?.src && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...parsedArticle, featured_image: undefined }
                            setParsedArticle(updated)
                            setJsonInput(JSON.stringify(updated, null, 2))
                          }}
                          className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-ink-tertiary hover:text-accent-red"
                          title="Remove custom cover"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interactive Article Renderer */}
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
                      className="text-xs text-ink-secondary hover:text-ink font-semibold min-h-[44px] flex items-center"
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
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as Draft</span>
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => handleSaveOrPublish('published')}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Publish Live</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-ink-tertiary bg-bg-elevated rounded-2xl border border-hairline space-y-3">
                  <p className="text-sm font-semibold text-ink">No article loaded yet.</p>
                  <p className="text-xs">Paste your JSON in the JSON Input tab or click below to load a sample.</p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleLoadSample}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Load Sample Template</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI PROMPT GENERATOR */}
      {activeTab === 'prompt-generator' && (
        <div className="space-y-6">
          <div className="p-5 bg-bg-elevated border border-hairline rounded-2xl space-y-2 shadow-xs">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-blue" />
              1-Click Zero-Error AI Prompt Studio
            </h2>
            <p className="text-xs text-ink-secondary">
              Paste your raw notes or article draft below. We attach the strict formatting rules and schema so ChatGPT, Claude, or Gemini returns 100% valid JSON.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Target Content Pillar:</label>
              <select
                value={targetCategory}
                onChange={(e: any) => setTargetCategory(e.target.value)}
                className="w-full sm:w-80 p-3 min-h-[44px] border border-hairline rounded-xl text-xs text-ink bg-bg-elevated focus:border-hairline-strong focus:outline-none"
              >
                <option value="prepare-for-nepal">Prepare for Nepal (Visas, Packing, Flights, Culture)</option>
                <option value="trekking-adventure">Trekking & Adventure (Routes, Permits, Altitude, Gear)</option>
                <option value="recovery-healing">Recovery & Healing (Yoga, Retreats, Ayurveda, Sound Healing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Your Raw Article Draft / Text Notes:</label>
              <textarea
                rows={8}
                value={rawArticleDraft}
                onChange={(e) => setRawArticleDraft(e.target.value)}
                placeholder="Paste your raw notes, article draft, or travel guide breakdown here..."
                className="w-full p-4 border border-hairline rounded-2xl text-xs text-ink bg-bg-elevated focus:border-hairline-strong focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-ink-secondary">
                Ready to transform into Nepalora JSON schema.
              </span>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCopyPrompt}
              >
                {copiedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-accent-blue" />}
                <span>{copiedNotice || 'Copy Master Prompt for AI'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA DOCUMENTATION */}
      {activeTab === 'docs' && (
        <div className="p-6 bg-bg-elevated border border-hairline rounded-2xl space-y-4 text-xs text-ink-secondary leading-relaxed shadow-xs">
          <h2 className="font-display text-base font-bold text-ink">Supported Block Types</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-bg rounded-xl border border-hairline space-y-1">
              <strong className="text-ink">1. paragraph:</strong>
              <p className="text-[11px] text-ink-secondary">Regular narrative text with optional bold, italic, and hyperlinks.</p>
            </div>
            <div className="p-4 bg-bg rounded-xl border border-hairline space-y-1">
              <strong className="text-ink">2. heading:</strong>
              <p className="text-[11px] text-ink-secondary">Section subtitles with levels 2, 3, or 4.</p>
            </div>
            <div className="p-4 bg-bg rounded-xl border border-hairline space-y-1">
              <strong className="text-ink">3. list:</strong>
              <p className="text-[11px] text-ink-secondary">Bullet or numbered item arrays for checklists and gear.</p>
            </div>
            <div className="p-4 bg-bg rounded-xl border border-hairline space-y-1">
              <strong className="text-ink">4. image:</strong>
              <p className="text-[11px] text-ink-secondary">Cloudinary or remote photo with alt, caption, and credit.</p>
            </div>
            <div className="p-4 bg-bg rounded-xl border border-hairline space-y-1">
              <strong className="text-ink">5. quote:</strong>
              <p className="text-[11px] text-ink-secondary">Callouts and quotes with author attribution.</p>
            </div>
          </div>
        </div>
      )}

      {/* INSERT BLOCK MODAL */}
      {insertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-bg-elevated rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-hairline max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent-blue" />
                Insert Block at Position #{targetInsertIndex + 1}
              </h2>
              <button
                type="button"
                onClick={() => setInsertModalOpen(false)}
                className="w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-tertiary hover:text-ink rounded-pill"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1.5">Block Type:</label>
                <div className="grid grid-cols-5 gap-1 bg-bg border border-hairline p-1 rounded-pill">
                  {(['image', 'heading', 'paragraph', 'list', 'quote'] as BlockType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedBlockType(type)}
                      className={`py-1.5 rounded-pill font-semibold capitalize transition-all min-h-[36px] cursor-pointer ${
                        selectedBlockType === type
                          ? 'bg-ink text-bg shadow-xs font-bold'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* IMAGE BLOCK FORM */}
              {selectedBlockType === 'image' && (
                <div className="space-y-3 p-4 bg-bg rounded-xl border border-hairline">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Upload Photo (Auto-Compressed):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadToCloudinary}
                      className="block w-full text-xs text-ink-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-pill file:border file:border-hairline file:text-xs file:font-semibold file:bg-bg-elevated file:text-ink"
                    />
                    {uploadingImage && (
                      <p className="text-[11px] text-accent-blue flex items-center gap-1 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Compressing & uploading image...
                      </p>
                    )}
                    {imageUploadError && <p className="text-[11px] text-accent-red mt-1">{imageUploadError}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-ink mb-1">Or Image URL:</label>
                    <input
                      type="text"
                      value={newImageSrc}
                      onChange={(e) => setNewImageSrc(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg-elevated"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-ink-secondary mb-0.5">Alt Description:</label>
                      <input
                        type="text"
                        value={newImageAlt}
                        onChange={(e) => setNewImageAlt(e.target.value)}
                        placeholder="e.g. Annapurna mountain peak"
                        className="w-full p-2 border border-hairline rounded-xl text-ink bg-bg-elevated"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-secondary mb-0.5">Photo Credit:</label>
                      <input
                        type="text"
                        value={newImageCredit}
                        onChange={(e) => setNewImageCredit(e.target.value)}
                        placeholder="e.g. Pemba Sherpa"
                        className="w-full p-2 border border-hairline rounded-xl text-ink bg-bg-elevated"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-ink-secondary mb-0.5">Caption:</label>
                    <input
                      type="text"
                      value={newImageCaption}
                      onChange={(e) => setNewImageCaption(e.target.value)}
                      placeholder="e.g. View of Machapuchare from high camp"
                      className="w-full p-2 border border-hairline rounded-xl text-ink bg-bg-elevated"
                    />
                  </div>
                </div>
              )}

              {/* HEADING BLOCK FORM */}
              {selectedBlockType === 'heading' && (
                <div className="space-y-3 p-4 bg-bg rounded-xl border border-hairline">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-ink">Level:</label>
                    <div className="flex gap-2">
                      {([2, 3, 4] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setNewHeadingLevel(lvl)}
                          className={`px-3 py-1.5 rounded-pill border text-xs font-bold min-h-[36px] min-w-[36px] ${
                            newHeadingLevel === lvl ? 'bg-ink text-bg border-ink' : 'bg-bg-elevated text-ink border-hairline'
                          }`}
                        >
                          H{lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-ink mb-1">Heading Text:</label>
                    <input
                      type="text"
                      value={newHeadingText}
                      onChange={(e) => setNewHeadingText(e.target.value)}
                      placeholder="e.g. Essential Gear Checklist"
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg-elevated"
                    />
                  </div>
                </div>
              )}

              {/* PARAGRAPH BLOCK FORM */}
              {selectedBlockType === 'paragraph' && (
                <div className="space-y-3 p-4 bg-bg rounded-xl border border-hairline">
                  <label className="block font-semibold text-ink mb-1">Paragraph Text:</label>
                  <textarea
                    rows={4}
                    value={newParagraphText}
                    onChange={(e) => setNewParagraphText(e.target.value)}
                    placeholder="Write detailed paragraph content here..."
                    className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg-elevated leading-relaxed"
                  />
                </div>
              )}

              {/* LIST BLOCK FORM */}
              {selectedBlockType === 'list' && (
                <div className="space-y-3 p-4 bg-bg rounded-xl border border-hairline">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-ink">Style:</label>
                    <select
                      value={newListStyle}
                      onChange={(e: any) => setNewListStyle(e.target.value)}
                      className="p-2 border border-hairline rounded-xl bg-bg-elevated text-ink"
                    >
                      <option value="bullet">Bullet List</option>
                      <option value="numbered">Numbered List</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-ink mb-1">List Items (One per line):</label>
                    <textarea
                      rows={4}
                      value={newListItems}
                      onChange={(e) => setNewListItems(e.target.value)}
                      placeholder="First item&#10;Second item&#10;Third item"
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg-elevated leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* QUOTE BLOCK FORM */}
              {selectedBlockType === 'quote' && (
                <div className="space-y-3 p-4 bg-bg rounded-xl border border-hairline">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Quote Text:</label>
                    <textarea
                      rows={3}
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      placeholder="Enter quotation..."
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg-elevated leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-ink mb-1">Author Attribution:</label>
                    <input
                      type="text"
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      placeholder="e.g. Local Sherpa Guide"
                      className="w-full p-2.5 border border-hairline rounded-xl text-ink bg-bg-elevated"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-hairline pt-4 flex justify-end gap-2">
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

export default function JSONImporterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 flex justify-center text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        </div>
      }
    >
      <JSONImporterContent />
    </Suspense>
  )
}
