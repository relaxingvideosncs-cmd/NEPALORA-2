import React from 'react'
import { AdSlot } from '@/components/ads/AdSlot'
import { Mountain, CheckCircle2 } from 'lucide-react'
import { getPublishedArticlesByCategory } from '@/lib/article/service'
import { CategoryArticleList } from '@/components/article/CategoryArticleList'
import { Badge } from '@/components/ui/Badge'
import { PolaroidGallery } from '@/components/common/PolaroidGallery'
import { getGalleryPhotos } from '@/lib/gallery/service'

export const metadata = {
  title: 'Trekking & Adventure in Nepal',
  description: 'Himalayan trekking routes, permits, difficulty levels, and mountain safety.',
}

export const revalidate = 3600

export default async function TrekkingAdventurePage() {
  const categorySlug = 'trekking-adventure'
  const [articles, trekkingPhotos] = await Promise.all([
    getPublishedArticlesByCategory(categorySlug),
    getGalleryPhotos('trekking_polaroid'),
  ])

  const routes = [
    'Everest Base Camp (EBC) & Gokyo Lakes',
    'Annapurna Circuit & Annapurna Base Camp (ABC)',
    'Mardi Himal & Poon Hill Scenic Trails',
    'Langtang Valley & Sacred Gosainkunda Lakes',
    'Manaslu Circuit & Hidden Tsum Valley',
    'Upper Mustang & Forbidden Kingdom Route',
    'Trekking Permits (TIMS, ACAP, National Parks)',
    'High Altitude Sickness & Acclimatization Rules',
    'Hiring Licensed Sherpa Guides & Porters',
    'Trekking Gear, Footwear & Layering Systems',
  ]

  return (
    <div className="space-y-8 sm:space-y-12">
      <AdSlot slug="category-top" />

      {/* Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="blue">
            <Mountain className="w-3 h-3 mr-1" />
            Himalayan Trekking
          </Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight">
          Trekking & Adventure
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl leading-relaxed">
          Detailed, honest route breakdowns, trail maps, elevation profiles, permit regulations, and high-altitude acclimatization protocols.
        </p>
      </header>

      {/* Polaroid Glimpses Carousel Gallery */}
      {trekkingPhotos.length > 0 && (
        <PolaroidGallery
          title="Glimpses of the Trail"
          subtitle="High-altitude passes, ancient Upper Mustang alleyways, and summit silhouettes."
          badgeText="Trail Glimpses"
          badgeTone="blue"
          photos={trekkingPhotos}
        />
      )}

      {/* Major Trekking Regions Checklist */}
      <section className="bg-bg-elevated rounded-2xl p-6 sm:p-8 border border-hairline shadow-xs">
        <h2 className="font-display text-base sm:text-lg font-bold text-ink mb-4">
          Major Trekking Regions & Mountain Safety
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {routes.map((r) => (
            <div key={r} className="flex items-center gap-2.5 text-xs sm:text-sm text-ink-secondary">
              <CheckCircle2 className="w-4 h-4 text-accent-blue flex-shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </section>

      <AdSlot slug="category-between-articles" />

      <section className="space-y-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Articles & Guides
        </h2>
        <CategoryArticleList articles={articles} categoryName="Trekking & Adventure" />
      </section>
    </div>
  )
}
