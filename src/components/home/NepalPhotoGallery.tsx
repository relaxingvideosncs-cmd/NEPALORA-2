import React from 'react'
import { NEPAL_PHOTOS, NepalPhoto } from '@/lib/data/nepalImages'
import { Camera, MapPin, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getWebImageUrl } from '@/lib/cloudinary/imageHelper'

export function NepalPhotoGallery() {
  const featuredPhotos = NEPAL_PHOTOS.filter((p) => p.featured).slice(0, 8)

  return (
    <section className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge tone="red">
              <Camera className="w-3 h-3 mr-1" />
              Visual Field Journal
            </Badge>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Moments Across Nepal
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-xl">
            Authentic glimpses of Himalayan high passes, ancient alleys of Mustang, and colorful street celebrations.
          </p>
        </div>
      </div>

      {/* Horizontal Scroll on Mobile / Multi-column Grid on Tablets & Desktops */}
      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {featuredPhotos.map((photo: NepalPhoto) => (
          <div
            key={photo.slug}
            className="flex-shrink-0 w-[280px] sm:w-auto snap-center group rounded-2xl border border-hairline bg-bg-elevated overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="aspect-[4/3] bg-hairline relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getWebImageUrl(photo.src, 'thumb')}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider bg-bg/85 backdrop-blur-xs text-ink border border-hairline shadow-2xs">
                  {photo.category.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xs sm:text-sm text-ink line-clamp-1">
                  {photo.title}
                </h3>
                {photo.caption && (
                  <p className="text-[11px] sm:text-xs text-ink-secondary line-clamp-2 leading-relaxed mt-1">
                    {photo.caption}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-hairline flex items-center justify-between text-[10px] text-ink-tertiary font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-accent-blue" />
                  Nepal
                </span>
                <span>{photo.optimizedSizeKb} KB WebP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
