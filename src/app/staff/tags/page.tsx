import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Tag as TagIcon, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Manage Tags',
}

export default async function ManageTagsPage() {
  const supabase = await createClient()

  let tags: any[] = []
  try {
    const { data } = await supabase.from('tags').select('*').order('name')
    if (data) tags = data
  } catch (err) {
    console.warn('Could not load tags:', err)
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div className="border-b border-hairline pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="blue">Keyword Registry</Badge>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Tags & Topics
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Keywords dynamically extracted and associated during JSON guide publishing.
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-2xl p-8 sm:p-12 text-center text-ink-tertiary bg-bg-elevated/40 space-y-2">
          <Hash className="w-8 h-8 mx-auto text-ink-tertiary" />
          <p className="font-semibold text-ink">No tags registered yet.</p>
          <p className="text-xs text-ink-tertiary">
            Tags specified in guide JSON documents will be indexed and displayed here automatically.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {tags.map((t) => (
            <span
              key={t.id}
              className="px-3.5 py-2 min-h-[38px] bg-bg-elevated border border-hairline rounded-pill text-xs font-semibold text-ink flex items-center gap-1.5 shadow-2xs"
            >
              <Hash className="w-3.5 h-3.5 text-accent-blue" />
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
