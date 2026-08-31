import React from 'react'
import { getSiteSettings } from '@/lib/settings/service'
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Building,
  Globe,
} from 'lucide-react'
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  XTwitterIcon,
  LinkedinIcon,
  TikTokIcon,
} from '@/components/common/SocialIcons'
import { Badge } from '@/components/ui/Badge'

export async function generateMetadata() {
  const settings = await getSiteSettings()
  const brandName = settings?.brand_name || 'Nepalora'

  return {
    title: `About ${brandName}`,
    description:
      settings?.description ||
      `Our mission, editorial philosophy, and independent approach to Nepal travel and wellness.`,
  }
}

export default async function AboutPage() {
  const settings = await getSiteSettings()

  const brandName = settings?.brand_name || 'Nepalora'
  const tagline = settings?.tagline || 'Himalayan Travel, Trekking & Mindful Recovery'
  const description =
    settings?.description ||
    'An independent knowledge sanctuary for travelers, trekkers, and seekers exploring Nepal.'

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 sm:py-10">
      {/* Brand Header */}
      <header className="border-b border-hairline pb-6 space-y-3">
        {settings?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_url}
            alt={brandName}
            className="w-16 h-16 rounded-2xl object-cover shadow-xs border border-hairline"
          />
        )}
        <div className="flex items-center gap-2">
          <Badge tone="red">Independent Editorial</Badge>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink leading-tight">
          About {brandName}
        </h1>
        <p className="text-sm font-semibold text-accent-red">{tagline}</p>
        <p className="mt-2 text-base text-ink-secondary leading-relaxed">
          {description}
        </p>

        {/* Feature Visual Banner */}
        <div className="pt-3">
          <div className="aspect-[21/9] sm:aspect-[2.4/1] rounded-2xl overflow-hidden border border-hairline bg-hairline relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/nepal/nepal-flag-himalayas.webp"
              alt="Soul of Nepal Himalayas"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </header>

      {/* Mission & Purpose */}
      <section className="space-y-4 text-ink leading-relaxed">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink underline-draw">
          Why We Exist
        </h2>
        <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
          Nepal is one of the most spiritually profound and geographically breathtaking places on Earth. However, travelers often encounter fragmented, out-of-date, or heavily commercialized information when planning their journeys.
        </p>
        <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
          {brandName} was created to serve as an authentic, structured, and trustworthy knowledge base. We bridge practical logistical guidance (visas, high-altitude safety, trail maps) with profound cultural understanding and holistic post-trek recovery.
        </p>

        {/* Dual Visual Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-hairline bg-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/nepal/mustang-alleyway-trekker.webp"
              alt="Upper Mustang Alleyway"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-hairline bg-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/nepal/fewa-lake-travelers-evening.webp"
              alt="Travelers in Pokhara"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Editorial Philosophy */}
      <section className="space-y-4 text-ink leading-relaxed">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink underline-draw">
          Our Editorial Philosophy
        </h2>
        <ul className="list-disc pl-6 space-y-2.5 text-sm sm:text-base text-ink-secondary leading-relaxed">
          <li>
            <strong className="text-ink">Functionality & Truth First:</strong> We provide structured, verified information with zero misleading hype.
          </li>
          <li>
            <strong className="text-ink">Independence:</strong> We are not a commercial tour agency or single-retreat advertisement. Our guides exist purely to empower the traveler.
          </li>
          <li>
            <strong className="text-ink">Respect for the Himalayas & Local Communities:</strong> We advocate for environmental preservation, leave-no-trace ethics, fair treatment of guides and porters, and cultural respect.
          </li>
        </ul>
      </section>

      {/* Business Details */}
      {(settings?.legal_business_name || settings?.founded_year || settings?.business_type) && (
        <section className="bg-bg-elevated rounded-2xl p-6 border border-hairline space-y-4 shadow-xs">
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <Building className="w-5 h-5 text-accent-blue" />
            Organization & Business Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {settings.legal_business_name && (
              <div>
                <span className="text-ink-tertiary block uppercase font-semibold text-[10px]">Legal Entity</span>
                <span className="font-semibold text-ink text-sm">{settings.legal_business_name}</span>
              </div>
            )}
            {settings.business_type && (
              <div>
                <span className="text-ink-tertiary block uppercase font-semibold text-[10px]">Type</span>
                <span className="font-semibold text-ink text-sm">{settings.business_type}</span>
              </div>
            )}
            {settings.founded_year && (
              <div>
                <span className="text-ink-tertiary block uppercase font-semibold text-[10px]">Founded Year</span>
                <span className="font-semibold text-ink text-sm">{settings.founded_year}</span>
              </div>
            )}
            {settings.website_url && (
              <div>
                <span className="text-ink-tertiary block uppercase font-semibold text-[10px]">Official Web</span>
                <a
                  href={settings.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-blue hover:underline flex items-center gap-1 text-sm font-mono"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{settings.website_url}</span>
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact & Inquiries Section */}
      <section id="contact" className="space-y-6 text-ink leading-relaxed border-t border-hairline pt-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">Contact & Inquiries</h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Have questions, verified route updates, or partnership inquiries? Get in touch directly:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settings?.email && (
            <div className="p-4 rounded-xl border border-hairline bg-bg-elevated space-y-1 shadow-2xs">
              <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-accent-blue" />
                Editorial Email
              </span>
              <a
                href={`mailto:${settings.email}`}
                className="text-xs sm:text-sm font-mono font-semibold text-ink hover:text-accent-blue block truncate py-1"
              >
                {settings.email}
              </a>
            </div>
          )}

          {settings?.support_email && (
            <div className="p-4 rounded-xl border border-hairline bg-bg-elevated space-y-1 shadow-2xs">
              <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-accent-blue" />
                Support Email
              </span>
              <a
                href={`mailto:${settings.support_email}`}
                className="text-xs sm:text-sm font-mono font-semibold text-ink hover:text-accent-blue block truncate py-1"
              >
                {settings.support_email}
              </a>
            </div>
          )}

          {settings?.whatsapp && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1 shadow-2xs">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                WhatsApp Direct
              </span>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline block py-1"
              >
                {settings.whatsapp}
              </a>
            </div>
          )}

          {settings?.phone && (
            <div className="p-4 rounded-xl border border-hairline bg-bg-elevated space-y-1 shadow-2xs">
              <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-accent-blue" />
                Phone Number
              </span>
              <a
                href={`tel:${settings.phone}`}
                className="text-xs sm:text-sm font-mono font-semibold text-ink hover:text-accent-blue block py-1"
              >
                {settings.phone}
              </a>
            </div>
          )}
        </div>

        {/* Physical Address */}
        {(settings?.address || settings?.city || settings?.country) && (
          <div className="p-4 rounded-xl border border-hairline bg-bg-elevated flex items-start gap-3 text-xs sm:text-sm shadow-2xs">
            <MapPin className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-ink block">Primary Location / Address</span>
              <p className="text-ink-secondary mt-0.5">
                {[
                  settings.address,
                  settings.city,
                  settings.district,
                  settings.province,
                  settings.postal_code,
                  settings.country || 'Nepal',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Social Channels */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-ink block mb-3">Connect on Social Channels</span>
          <div className="flex flex-wrap gap-2.5">
            {settings?.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink hover:border-hairline-strong transition-all active:scale-95 shadow-2xs"
              >
                <FacebookIcon className="w-4 h-4 text-blue-600" />
                <span>Facebook</span>
              </a>
            )}
            {settings?.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink hover:border-hairline-strong transition-all active:scale-95 shadow-2xs"
              >
                <InstagramIcon className="w-4 h-4 text-pink-600" />
                <span>Instagram</span>
              </a>
            )}
            {settings?.youtube_url && (
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink hover:border-hairline-strong transition-all active:scale-95 shadow-2xs"
              >
                <YoutubeIcon className="w-4 h-4 text-red-600" />
                <span>YouTube</span>
              </a>
            )}
            {settings?.x_url && (
              <a
                href={settings.x_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink hover:border-hairline-strong transition-all active:scale-95 shadow-2xs"
              >
                <XTwitterIcon className="w-3.5 h-3.5" />
                <span>X (Twitter)</span>
              </a>
            )}
            {settings?.linkedin_url && (
              <a
                href={settings.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink hover:border-hairline-strong transition-all active:scale-95 shadow-2xs"
              >
                <LinkedinIcon className="w-4 h-4 text-blue-700" />
                <span>LinkedIn</span>
              </a>
            )}
            {settings?.tiktok_url && (
              <a
                href={settings.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-pill border border-hairline bg-bg-elevated text-xs font-semibold text-ink hover:border-hairline-strong transition-all active:scale-95 shadow-2xs"
              >
                <TikTokIcon className="w-4 h-4" />
                <span>TikTok</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
