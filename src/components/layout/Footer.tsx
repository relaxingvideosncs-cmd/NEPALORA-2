'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiteSettingsRecord } from '@/types/database'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  XTwitterIcon,
  LinkedinIcon,
  TikTokIcon,
} from '@/components/common/SocialIcons'

interface FooterProps {
  isMaintenance?: boolean
  settings?: SiteSettingsRecord | null
}

export function Footer({ isMaintenance = false, settings }: FooterProps) {
  const pathname = usePathname()
  const isStaffRoute = pathname?.startsWith('/staff')
  const showPublicLinks = !isMaintenance || isStaffRoute

  const brandName = settings?.brand_name || 'Nepalora'
  const tagline = settings?.tagline || 'Nepal Travel, Trekking & Wellness Guides'
  const description =
    settings?.description ||
    'Your complete guide to Nepal — expert trekking routes, Himalayan adventure preparation, and post-trek wellness.'
  const currentYear = new Date().getFullYear()
  const foundedYear = settings?.founded_year || 2026
  const copyrightOwner = settings?.legal_business_name || brandName

  if (isStaffRoute) {
    return (
      <footer className="border-t border-hairline bg-bg-elevated/50 text-ink-tertiary text-xs mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{brandName}</span>
            <span>•</span>
            <span>Staff Admin Console</span>
          </div>
          <div className="flex items-center gap-4 text-ink-secondary">
            <Link href="/staff/dashboard" className="hover:text-ink transition-colors">
              Dashboard
            </Link>
            <Link href="/staff/articles" className="hover:text-ink transition-colors">
              Articles
            </Link>
            <Link href="/staff/import" className="hover:text-ink transition-colors">
              Studio
            </Link>
            <Link href="/staff/galleries" className="hover:text-ink transition-colors">
              Galleries
            </Link>
            <Link href="/staff/settings" className="hover:text-ink transition-colors">
              Settings
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors text-accent-blue font-medium"
            >
              Live Site ↗
            </Link>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-hairline bg-bg-elevated/40 text-ink-secondary text-sm mt-16 sm:mt-24 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Link
              href="/"
              className="font-display font-bold text-lg text-ink tracking-tight flex items-center gap-2"
            >
              {settings?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logo_url}
                  alt={brandName}
                  className="w-7 h-7 object-contain rounded"
                />
              ) : null}
              <span>{brandName}</span>
            </Link>
            <p className="text-xs text-accent-red font-semibold">{tagline}</p>
            <p className="text-xs text-ink-secondary leading-relaxed max-w-md">
              {description}
            </p>

            {/* Social Media Links with Touch-Friendly Dimensions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {settings?.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-accent-blue hover:border-accent-blue/30 transition-all flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-accent-red hover:border-accent-red/30 transition-all flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-accent-red hover:border-accent-red/30 transition-all flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.x_url && (
                <a
                  href={settings.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-ink hover:border-hairline-strong transition-all flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  <XTwitterIcon className="w-3.5 h-3.5" />
                </a>
              )}
              {settings?.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-accent-blue hover:border-accent-blue/30 transition-all flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
              {settings?.tiktok_url && (
                <a
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-pill border border-hairline bg-bg-elevated text-ink-secondary hover:text-ink hover:border-hairline-strong transition-all flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  <TikTokIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Pillars */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              Explore Guides
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/prepare-for-nepal" className="underline-draw text-ink-secondary hover:text-ink transition-colors py-1 inline-block">
                  Preparation for Nepal
                </Link>
              </li>
              <li>
                <Link href="/trekking-adventure" className="underline-draw text-ink-secondary hover:text-ink transition-colors py-1 inline-block">
                  Trekking & Adventure
                </Link>
              </li>
              <li>
                <Link href="/recovery-healing" className="underline-draw text-ink-secondary hover:text-ink transition-colors py-1 inline-block">
                  Recovery & Healing
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="underline-draw text-ink-secondary hover:text-ink transition-colors py-1 inline-block">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/articles" className="underline-draw text-ink-secondary hover:text-ink transition-colors py-1 inline-block">
                  All Articles & Guides
                </Link>
              </li>
              <li>
                <Link href="/search" className="underline-draw text-ink-secondary hover:text-ink transition-colors py-1 inline-block">
                  Search Topics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 text-xs text-ink-secondary">
            <h4 className="font-bold uppercase tracking-wider text-ink">
              Get in Touch
            </h4>
            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-2 hover:text-ink transition-colors py-1 min-h-[36px]"
              >
                <Mail className="w-4 h-4 text-ink-tertiary" />
                <span className="truncate">{settings.email}</span>
              </a>
            )}
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-2 hover:text-ink transition-colors py-1 min-h-[36px]"
              >
                <Phone className="w-4 h-4 text-ink-tertiary" />
                <span>{settings.phone}</span>
              </a>
            )}
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold transition-colors py-1 min-h-[36px]"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp Direct</span>
              </a>
            )}
            {(settings?.city || settings?.country) && (
              <div className="flex items-center gap-2 text-ink-tertiary pt-1">
                <MapPin className="w-4 h-4 text-ink-tertiary" />
                <span>{[settings.city, settings.district, settings.country || 'Nepal'].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-ink-tertiary">
          <p>
            © {foundedYear === currentYear ? currentYear : `${foundedYear}–${currentYear}`} {copyrightOwner}. All rights reserved.
          </p>

          <nav className="flex flex-wrap items-center gap-6">
            {showPublicLinks && (
              <>
                <Link href="/about" className="underline-draw hover:text-ink transition-colors py-1">
                  About Us
                </Link>
                <Link href="/about#contact" className="underline-draw hover:text-ink transition-colors py-1">
                  Contact
                </Link>
              </>
            )}
            <Link
              href="/staff/dashboard"
              className="text-ink-secondary hover:text-accent-blue transition-colors font-semibold py-1"
            >
              Staff Portal →
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
