import React from 'react'
import Link from 'next/link'
import { Compass, Mountain, HeartHandshake, BookOpen, ArrowRight } from 'lucide-react'
import { AdSlot } from '@/components/ads/AdSlot'
import { createPublicClient } from '@/lib/supabase/server'
import { NoticeBoard } from '@/components/home/NoticeBoard'
import { ArticleCard } from '@/components/article/ArticleCard'
import { HeroSlideshow } from '@/components/home/HeroSlideshow'
import { PhotoGridGallery } from '@/components/home/PhotoGridGallery'
import { RandomReadButton } from '@/components/article/RandomReadButton'
import { getActiveBulletins } from '@/lib/bulletin/service'
import { getGalleryPhotos } from '@/lib/gallery/service'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const supabase = createPublicClient()

  const [articlesRes, bulletins, heroSlides, homeGridPhotos] = await Promise.all([
    supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content_json,
        published_at,
        category:categories(name, slug)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    getActiveBulletins(),
    getGalleryPhotos('hero'),
    getGalleryPhotos('home_grid'),
  ])

  const latestArticles = articlesRes.data || []

  return (
    <div className="space-y-10 sm:space-y-16 -mt-6 sm:-mt-10">
      {/* Full-Bleed Edge-to-Edge Hero Slideshow (100vw) */}
      <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw]">
        <HeroSlideshow slides={heroSlides} />
      </div>

      {/* Top Ad Slot */}
      <AdSlot slug="homepage-top" />

      {/* Live Trail Advisories & Noticeboard */}
      <NoticeBoard bulletins={bulletins} />

      {/* Content Pillars / Categories Overview (Clean & Uncluttered) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Pillar 1: Preparation for Nepal */}
        <Link
          href="/prepare-for-nepal"
          className="p-6 sm:p-7 rounded-2xl border border-hairline bg-bg-elevated hover:border-hairline-strong shadow-xs hover:shadow-md transition-all group flex flex-col justify-between active:scale-[0.99]"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-bg border border-hairline text-ink flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
              <Compass className="w-6 h-6 text-accent-blue" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge tone="blue">Logistics & Safety</Badge>
            </div>
            <h2 className="font-display text-xl font-bold text-ink underline-draw">
              Preparation for Nepal
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Visas on arrival, SIM & eSIM cards, baggage checklists, weather patterns, airport transfers, and local etiquette.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-hairline text-xs font-semibold text-ink flex items-center gap-1 group-hover:text-accent-blue transition-colors">
            <span>Explore checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Pillar 2: Trekking & Adventure */}
        <Link
          href="/trekking-adventure"
          className="p-6 sm:p-7 rounded-2xl border border-hairline bg-bg-elevated hover:border-hairline-strong shadow-xs hover:shadow-md transition-all group flex flex-col justify-between active:scale-[0.99]"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-bg border border-hairline text-ink flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
              <Mountain className="w-6 h-6 text-accent-blue" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge tone="blue">Himalayan Routes</Badge>
            </div>
            <h2 className="font-display text-xl font-bold text-ink underline-draw">
              Trekking & Adventure
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Everest, Annapurna, Mustang, Manaslu, permits, mountain safety, gear guides, and high-altitude acclimatization.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-hairline text-xs font-semibold text-ink flex items-center gap-1 group-hover:text-accent-blue transition-colors">
            <span>View trail guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Pillar 3: Recovery & Healing */}
        <Link
          href="/recovery-healing"
          className="p-6 sm:p-7 rounded-2xl border border-hairline bg-bg-elevated hover:border-hairline-strong shadow-xs hover:shadow-md transition-all group flex flex-col justify-between active:scale-[0.99]"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-bg border border-hairline text-ink flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
              <HeartHandshake className="w-6 h-6 text-accent-red" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge tone="red">Mindful Sanctuaries</Badge>
            </div>
            <h2 className="font-display text-xl font-bold text-ink underline-draw">
              Recovery & Healing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Post-trek recovery sanctuaries, sound healing in Kathmandu, lakeside Pokhara retreats, and Himalayan Ayurveda.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-hairline text-xs font-semibold text-ink flex items-center gap-1 group-hover:text-accent-red transition-colors">
            <span>Discover retreats</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </section>

      {/* Middle Ad Slot */}
      <AdSlot slug="homepage-between-sections" />

      {/* Featured & Latest Guides Section (Rendered only when articles exist) */}
      {latestArticles.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-blue" />
              Latest Guides & Articles
            </h2>
            <div className="flex items-center gap-3">
              <RandomReadButton slugs={latestArticles.map((a: any) => a.slug)} />
              <Link
                href="/articles"
                className="text-xs font-semibold text-ink-secondary hover:text-ink underline-draw"
              >
                View all →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {latestArticles.map((art: any) => (
              <ArticleCard
                key={art.id}
                article={art}
                featured={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2x3 Photo Grid Gallery (Rendered only when home-grid photos are uploaded) */}
      {homeGridPhotos.length > 0 && (
        <PhotoGridGallery
          title="Glimpses Across Nepal"
          subtitle="Unscripted moments from mountain passes, ancient corridors, and sacred lakeside evenings."
          badgeText="Gallery"
          badgeTone="red"
          photos={homeGridPhotos}
        />
      )}
    </div>
  )
}
