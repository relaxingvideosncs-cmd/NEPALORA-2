'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArticleJSON,
  ArticleBlock,
  InlineSpan,
  ParagraphBlock,
  HeadingBlock,
  ListBlock,
  QuoteBlock,
  ImageBlock,
} from '@/types/article'
import { Plus, Trash2 } from 'lucide-react'
import { ReadingProgress } from './ReadingProgress'
import { ArticleActions } from './ArticleActions'
import { Badge } from '@/components/ui/Badge'
import { ProgressiveImage } from '@/components/common/ProgressiveImage'

interface ArticleRendererProps {
  article: ArticleJSON
  isEditable?: boolean
  onInsertBlockAt?: (index: number) => void
  onUpdateBlock?: (index: number, updated: ArticleBlock) => void
  onDeleteBlock?: (index: number) => void
}

export function ArticleRenderer({
  article,
  isEditable = false,
  onInsertBlockAt,
  onUpdateBlock,
  onDeleteBlock,
}: ArticleRendererProps) {
  const renderInlineContent = (content: InlineSpan[] | string | undefined) => {
    if (!content) return null
    if (typeof content === 'string') return content

    return content.map((span, i) => {
      let textNode: React.ReactNode = span.text

      if (span.bold) {
        textNode = <strong key={`b-${i}`}>{textNode}</strong>
      }
      if (span.italic) {
        textNode = <em key={`i-${i}`}>{textNode}</em>
      }
      if (span.link) {
        const safeHref =
          span.link.startsWith('http://') ||
          span.link.startsWith('https://') ||
          span.link.startsWith('/')
            ? span.link
            : '#'
        textNode = (
          <a
            key={`a-${i}`}
            href={safeHref}
            target={safeHref.startsWith('http') ? '_blank' : undefined}
            rel={safeHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-accent-blue underline hover:opacity-80"
          >
            {textNode}
          </a>
        )
      }

      return <React.Fragment key={i}>{textNode}</React.Fragment>
    })
  }

  const renderBlock = (block: ArticleBlock, index: number) => {
    switch (block.type) {
      case 'paragraph': {
        const pBlock = block as ParagraphBlock
        return (
          <p
            className="my-5 text-base sm:text-[17px] leading-[1.75] text-ink"
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e: React.FocusEvent<HTMLParagraphElement>) => {
              if (isEditable && onUpdateBlock) {
                onUpdateBlock(index, { ...pBlock, text: e.currentTarget.innerText })
              }
            }}
          >
            {pBlock.content ? renderInlineContent(pBlock.content) : pBlock.text}
          </p>
        )
      }

      case 'heading': {
        const hBlock = block as HeadingBlock
        const headingClasses = {
          2: 'font-display text-2xl sm:text-3xl font-bold text-ink mt-10 mb-4 border-b border-hairline pb-2',
          3: 'font-display text-xl sm:text-2xl font-bold text-ink mt-8 mb-3',
          4: 'font-display text-lg sm:text-xl font-bold text-ink mt-6 mb-2',
        }[hBlock.level]

        const HeadingTag = `h${hBlock.level}` as 'h2' | 'h3' | 'h4'

        return (
          <HeadingTag
            className={headingClasses}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e: React.FocusEvent<HTMLHeadingElement>) => {
              if (isEditable && onUpdateBlock) {
                onUpdateBlock(index, { ...hBlock, text: e.currentTarget.innerText })
              }
            }}
          >
            {hBlock.text}
          </HeadingTag>
        )
      }

      case 'list': {
        const lBlock = block as ListBlock
        const ListTag = lBlock.style === 'numbered' ? 'ol' : 'ul'
        const listClass =
          lBlock.style === 'numbered'
            ? 'list-decimal pl-6 my-5 space-y-2.5 text-ink'
            : 'list-disc pl-6 my-5 space-y-2.5 text-ink'

        return (
          <ListTag className={listClass}>
            {lBlock.items.map((item, itemIdx) => (
              <li key={itemIdx} className="text-base sm:text-[17px] leading-relaxed text-ink">
                {typeof item === 'string' ? item : renderInlineContent(item)}
              </li>
            ))}
          </ListTag>
        )
      }

      case 'quote': {
        const qBlock = block as QuoteBlock
        return (
          <blockquote className="border-l-2 border-accent-blue pl-5 py-2 my-8 italic text-ink-secondary bg-bg-elevated/70 rounded-r-md">
            <p
              className="text-base sm:text-lg leading-relaxed text-ink"
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e: React.FocusEvent<HTMLParagraphElement>) => {
                if (isEditable && onUpdateBlock) {
                  onUpdateBlock(index, { ...qBlock, text: e.currentTarget.innerText })
                }
              }}
            >
              {qBlock.text}
            </p>
            {qBlock.author && (
              <cite className="block text-xs sm:text-sm text-ink-tertiary mt-2 not-italic font-medium">
                — {qBlock.author}
              </cite>
            )}
          </blockquote>
        )
      }

      case 'image': {
        const imgBlock = block as ImageBlock
        const alignClass = {
          left: 'mr-auto text-left max-w-lg',
          center: 'mx-auto text-center max-w-2xl',
          right: 'ml-auto text-right max-w-lg',
        }[imgBlock.alignment || 'center']

        return (
          <figure className={`my-8 ${alignClass}`}>
            <ProgressiveImage
              src={imgBlock.src}
              alt={imgBlock.alt || article.title}
              profile="article"
              className="w-full h-auto rounded-lg sm:rounded-xl border border-hairline shadow-xs object-cover max-h-[500px]"
              loading="lazy"
            />
            {(imgBlock.caption || imgBlock.credit) && (
              <figcaption className="text-xs sm:text-sm text-ink-tertiary mt-2.5 px-1 text-center">
                {imgBlock.caption && <span>{imgBlock.caption} </span>}
                {imgBlock.credit && (
                  <span className="text-ink-tertiary font-mono text-xs">Photo: {imgBlock.credit}</span>
                )}
              </figcaption>
            )}
          </figure>
        )
      }

      default:
        return null
    }
  }

  let totalWords = (article.title + ' ' + article.excerpt).split(/\s+/).filter(Boolean).length
  ;(article.blocks || []).forEach((b) => {
    if (b.type === 'paragraph') {
      totalWords += ((b as ParagraphBlock).text || '').split(/\s+/).filter(Boolean).length
    } else if (b.type === 'heading') {
      totalWords += ((b as HeadingBlock).text || '').split(/\s+/).filter(Boolean).length
    } else if (b.type === 'quote') {
      totalWords += ((b as QuoteBlock).text || '').split(/\s+/).filter(Boolean).length
    } else if (b.type === 'list') {
      ;(b as ListBlock).items.forEach((it) => {
        if (typeof it === 'string') totalWords += it.split(/\s+/).filter(Boolean).length
      })
    }
  })

  const blocksToRender = article.blocks || []

  return (
    <>
      {!isEditable && <ReadingProgress />}

      <article className="max-w-3xl mx-auto px-2 sm:px-4 py-6 sm:py-10">
        {/* Article Header */}
        <header className="mb-8 border-b border-hairline pb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Badge tone="blue">{article.category}</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl md:text-[40px] font-bold text-ink mb-4 leading-[1.2] tracking-tight">
            {article.title}
          </h1>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed">
            {article.excerpt}
          </p>

          {/* Reading Actions, PDF Download, and Share Bar */}
          {!isEditable && (
            <ArticleActions article={article} wordCount={totalWords} />
          )}

          {/* Featured Cover Image */}
          {article.featured_image?.src && (
            <figure className="my-6">
              <ProgressiveImage
                src={article.featured_image.src}
                alt={article.featured_image.alt || article.title}
                profile="article"
                className="w-full h-auto rounded-lg sm:rounded-xl border border-hairline shadow-xs object-cover max-h-[500px]"
                loading="eager"
              />
              {(article.featured_image.caption || article.featured_image.credit) && (
                <figcaption className="text-xs text-ink-tertiary mt-2 px-1 text-center">
                  {article.featured_image.caption}{' '}
                  {article.featured_image.credit && `Photo: ${article.featured_image.credit}`}
                </figcaption>
              )}
            </figure>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-hairline">
            {article.author && (
              <span className="text-xs sm:text-sm font-medium text-ink-secondary">
                Written by <span className="font-semibold text-ink">{article.author}</span>
              </span>
            )}

            {/* Clickable Hashtags with Nepalora Badge */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {article.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="inline-flex items-center h-7 px-3 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-ink hover:border-hairline-strong transition-all text-xs font-medium active:scale-95 shadow-2xs"
                    title={`Search guides tagged #${t}`}
                  >
                    <span className="text-accent-blue font-semibold mr-1">#</span>
                    <span>{t}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Insertion point before blocks */}
        {isEditable && onInsertBlockAt && (
          <div className="relative group py-2 flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-hairline group-hover:bg-accent-blue transition-colors" />
            <button
              type="button"
              onClick={() => onInsertBlockAt(0)}
              className="relative z-10 p-1 bg-bg-elevated border border-hairline rounded-pill text-ink-secondary hover:text-ink transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-3 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Insert Block</span>
            </button>
          </div>
        )}

        {/* Render Content Blocks */}
        <div className="space-y-4">
          {blocksToRender.map((block, idx) => (
            <React.Fragment key={idx}>
              <div className="relative group">
                {isEditable && onDeleteBlock && (
                  <button
                    type="button"
                    onClick={() => onDeleteBlock(idx)}
                    className="absolute -right-8 top-1 p-1 text-ink-tertiary hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {renderBlock(block, idx)}
              </div>

              {/* Insertion point between blocks */}
              {isEditable && onInsertBlockAt && (
                <div className="relative group py-2 flex items-center justify-center">
                  <div className="absolute inset-x-0 h-px bg-hairline group-hover:bg-accent-blue transition-colors" />
                  <button
                    type="button"
                    onClick={() => onInsertBlockAt(idx + 1)}
                    className="relative z-10 p-1 bg-bg-elevated border border-hairline rounded-pill text-ink-secondary hover:text-ink transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-3 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Block</span>
                  </button>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </article>
    </>
  )
}
