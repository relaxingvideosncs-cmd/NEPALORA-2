import React from 'react'
import { AdSlot } from '@/components/ads/AdSlot'
import { Compass, CheckCircle2 } from 'lucide-react'
import { getPublishedArticlesByCategory } from '@/lib/article/service'
import { CategoryArticleList } from '@/components/article/CategoryArticleList'
import { Badge } from '@/components/ui/Badge'
import { PolaroidGallery } from '@/components/common/PolaroidGallery'
import { getGalleryPhotos } from '@/lib/gallery/service'

export const metadata = {
  title: 'Preparation for Nepal',
  description: 'Essential information, visas, packing, safety, and cultural etiquette for travelers visiting Nepal.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PrepareForNepalPage() {
  const categorySlug = 'prepare-for-nepal'
  const [articles, preparePhotos] = await Promise.all([
    getPublishedArticlesByCategory(categorySlug),
    getGalleryPhotos('prepare_polaroid'),
  ])

  const topics = [
    'Passport & Visa On Arrival Procedures',
    'Travel Insurance & Emergency Evacuation Coverage',
    'Local ATMs, Cards & Currency Exchange Rules',
    'Ncell / Nepal Telecom SIM Cards & eSIM Setup',
    'Kathmandu & Pokhara Airport Taxi Navigation',
    'Food Safety, Drinking Water & Street Eats',
    'Monsoon, Spring & Autumn Climate Windows',
    'Comprehensive All-Season Packing Checklists',
    'Temple Etiquette, Cultural Norms & Customs',
    'Domestic Flights (Lukla, Pokhara) Safety & Booking',
  ]

  return (
    <div className="space-y-8 sm:space-y-12">
      <AdSlot slug="category-top" />

      {/* Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="blue">
            <Compass className="w-3 h-3 mr-1" />
            Core Knowledge Pillar
          </Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight">
          Preparation for Nepal
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl leading-relaxed">
          Everything you need to know before landing at Tribhuvan International Airport. Practical, structured, and verified travel guidance.
        </p>
      </header>

      {/* Polaroid Glimpses Carousel Gallery */}
      {preparePhotos.length > 0 && (
        <PolaroidGallery
          title="Glimpses of Nepal Life"
          subtitle="Vibrant street celebrations, local culinary fuel, and city transit scenes."
          badgeText="Cultural Glimpses"
          badgeTone="neutral"
          photos={preparePhotos}
        />
      )}

      {/* Essential Checklist */}
      <section className="bg-bg-elevated rounded-2xl p-6 sm:p-8 border border-hairline shadow-xs">
        <h2 className="font-display text-base sm:text-lg font-bold text-ink mb-4">
          Essential Pre-Departure Checklist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {topics.map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-xs sm:text-sm text-ink-secondary">
              <CheckCircle2 className="w-4 h-4 text-accent-blue flex-shrink-0" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      <AdSlot slug="category-between-articles" />

      <section className="space-y-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Articles & Guides
        </h2>
        <CategoryArticleList articles={articles} categoryName="Prepare for Nepal" />
      </section>
    </div>
  )
}
