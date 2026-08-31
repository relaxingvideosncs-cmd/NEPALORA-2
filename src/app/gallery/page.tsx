import React from 'react'
import type { Metadata } from 'next'
import { AdSlot } from '@/components/ads/AdSlot'
import { Badge } from '@/components/ui/Badge'
import { getAllPublishedGalleryPhotos } from '@/lib/gallery/service'
import { GalleryBrowser } from '@/components/gallery/GalleryBrowser'
import { Images } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Himalayan Photography Gallery | Nepalora',
  description:
    'Visual collection of high-resolution field notes from mountain passes, monastery courtyards, and tranquil sanctuaries across Nepal.',
}

export default async function GalleryPage() {
  const photos = await getAllPublishedGalleryPhotos()

  return (
    <div className="space-y-8 sm:space-y-12">
      <AdSlot slug="category-top" />

      {/* Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="red">
            <Images className="w-3 h-3 mr-1" />
            Visual Collection
          </Badge>
          <span className="text-xs text-ink-tertiary font-mono">
            {photos.length} Photographs
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight">
          Himalayan Gallery
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl leading-relaxed">
          High-resolution visual field notes from mountain passes, monastery courtyards, and tranquil sanctuaries across Nepal.
        </p>
      </header>

      {/* Gallery Interactive Browser with Instant Pre-rendered Photos */}
      <GalleryBrowser initialPhotos={photos} />
    </div>
  )
}
