import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { FolderTree, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Manage Categories',
}

export default async function ManageCategoriesPage() {
  const supabase = await createClient()

  let categories: any[] = []
  try {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) categories = data
  } catch (err) {
    console.warn('Could not load categories:', err)
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div className="border-b border-hairline pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="blue">Editorial Taxonomy</Badge>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Content Pillars & Categories
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          The 3 primary editorial pillars of Nepalora.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="border border-hairline rounded-2xl p-5 sm:p-6 bg-bg-elevated shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs px-2.5 py-0.5 bg-bg rounded-pill border border-hairline text-ink font-semibold">
                /{cat.slug}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-display text-lg font-bold text-ink">{cat.name}</h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">{cat.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
