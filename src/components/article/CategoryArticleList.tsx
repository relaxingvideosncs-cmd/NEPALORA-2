'use client'

import React from 'react'
import { BookOpen } from 'lucide-react'
import { ArticleCard } from '@/components/article/ArticleCard'
import { useScrollReveal } from '@/hooks/useScrollReveal'

interface CategoryArticleListProps {
  articles: any[]
  categoryName: string
}

export function CategoryArticleList({ articles, categoryName }: CategoryArticleListProps) {
  const gridRef = useScrollReveal<HTMLDivElement>(60)

  if (articles.length === 0) {
    return (
      <div className="border border-dashed border-hairline-strong rounded-2xl p-8 sm:p-12 text-center text-ink-tertiary bg-bg-elevated/40 space-y-2">
        <BookOpen className="w-8 h-8 mx-auto text-ink-tertiary" />
        <p className="font-semibold text-ink">No published articles yet in {categoryName}.</p>
        <p className="text-xs text-ink-tertiary">
          New guides published via the Publishing Studio will appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {articles.map((art, index) => (
        <ArticleCard key={art.id} article={art} featured={index === 0 && articles.length > 2} />
      ))}
    </div>
  )
}
