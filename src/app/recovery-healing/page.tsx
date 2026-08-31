import React from 'react'
import { AdSlot } from '@/components/ads/AdSlot'
import { HeartHandshake, CheckCircle2 } from 'lucide-react'
import { getPublishedArticlesByCategory } from '@/lib/article/service'
import { CategoryArticleList } from '@/components/article/CategoryArticleList'
import { Badge } from '@/components/ui/Badge'
import { PolaroidGallery } from '@/components/common/PolaroidGallery'
import { getGalleryPhotos } from '@/lib/gallery/service'

export const metadata = {
  title: 'Recovery & Healing in Nepal',
  description: 'Post-trek wellness, yoga, meditation, breathwork, Ayurveda, and healing retreats in Nepal.',
}

export const revalidate = 3600

export default async function RecoveryHealingPage() {
  const categorySlug = 'recovery-healing'
  const [articles, recoveryPhotos] = await Promise.all([
    getPublishedArticlesByCategory(categorySlug),
    getGalleryPhotos('recovery_polaroid'),
  ])

  const healingTopics = [
    'Post-Trek Physical & Muscle Recovery Protocols',
    'Tibetan Sound Bowl Therapy & Nada Yoga Vibrations',
    'Traditional Himalayan Ayurvedic Massages & Herbal Oils',
    'Vipassana & Buddhist Silent Meditation Sanctuaries',
    'Yoga Teacher Trainings & Ashrams in Pokhara & Kathmandu',
    'Breathwork (Pranayama) & Nervous System Downregulation',
    'Organic Herbal Remedies & High-Altitude Medicinal Teas',
    'Holistic Eco-Wellness Retreats in Hill Sanctuaries',
  ]

  return (
    <div className="space-y-8 sm:space-y-12">
      <AdSlot slug="category-top" />

      {/* Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="red">
            <HeartHandshake className="w-3 h-3 mr-1" />
            Mindful Wellness
          </Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-tight leading-tight">
          Recovery & Healing
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl leading-relaxed">
          Integrating ancient Himalayan spiritual traditions, ayurvedic healing, and mindful recovery sanctuaries for travelers seeking restoration.
        </p>
      </header>

      {/* Polaroid Glimpses Carousel Gallery */}
      {recoveryPhotos.length > 0 && (
        <PolaroidGallery
          title="Glimpses of Healing & Stillness"
          subtitle="Golden hour waters on Fewa Lake, quiet Buddhist monasteries, and twilight hill sanctuaries."
          badgeText="Sanctuary Glimpses"
          badgeTone="red"
          photos={recoveryPhotos}
        />
      )}

      {/* Wellness Disciplines Grid */}
      <section className="bg-bg-elevated rounded-2xl p-6 sm:p-8 border border-hairline shadow-xs">
        <h2 className="font-display text-base sm:text-lg font-bold text-ink mb-4">
          Wellness & Recovery Disciplines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {healingTopics.map((topic) => (
            <div key={topic} className="flex items-center gap-2.5 text-xs sm:text-sm text-ink-secondary">
              <CheckCircle2 className="w-4 h-4 text-accent-red flex-shrink-0" />
              <span>{topic}</span>
            </div>
          ))}
        </div>
      </section>

      <AdSlot slug="category-between-articles" />

      <section className="space-y-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Articles & Guides
        </h2>
        <CategoryArticleList articles={articles} categoryName="Recovery & Healing" />
      </section>
    </div>
  )
}
