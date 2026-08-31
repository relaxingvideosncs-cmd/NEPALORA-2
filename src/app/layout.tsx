import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { sfProText, sfProDisplay, sfUiText, sfUiDisplay, caveatFont } from '@/lib/fonts'
import { ThemeScript } from '@/components/ui/ThemeScript'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BulletinBanner } from '@/components/layout/BulletinBanner'
import { SiteMaintenanceGate } from '@/components/layout/SiteMaintenanceGate'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { getActiveBulletins } from '@/lib/bulletin/service'
import { getSiteSettings } from '@/lib/settings/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nepalora.com'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  const brandName = settings?.brand_name || 'Nepalora'
  const title = settings?.seo_title || `${brandName} — Nepal Travel, Trekking & Wellness Guides`
  const description =
    settings?.seo_description ||
    'Nepalora is your complete guide to Nepal — expert trekking routes, Himalayan adventure preparation, visa tips, and post-trek wellness. Trusted, independent, and constantly updated.'
  const keywords = settings?.seo_keywords && settings.seo_keywords.length > 0
    ? settings.seo_keywords
    : [
        'Nepal travel guide',
        'Trekking in Nepal',
        'Everest Base Camp',
        'Annapurna Circuit',
        'Langtang Trek',
        'Nepal visa on arrival',
        'High altitude acclimatization',
        'Yoga retreats Nepal',
        'Ayurveda and sound healing Kathmandu',
        'Himalayan trekking seasons',
      ]

  const ogImage = settings?.og_image_url || undefined
  const favicon = settings?.favicon_url || '/favicon.ico'

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${brandName}`,
    },
    description,
    keywords,
    icons: {
      icon: [
        {
          url: favicon,
        },
      ],
      shortcut: [favicon],
      apple: [favicon],
    },
    verification: settings?.google_site_verification
      ? { google: settings.google_site_verification }
      : undefined,
    authors: [{ name: `${brandName} Editorial Team` }],
    creator: brandName,
    publisher: brandName,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: brandName,
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [bulletins, settings] = await Promise.all([
    getActiveBulletins(),
    getSiteSettings(),
  ])

  // Explicit check: if settings exists, use exact boolean value of is_active
  const isSiteActive = settings ? Boolean(settings.is_active) : true

  // WebSite Schema with Sitelinks SearchBox for Google
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings?.brand_name || 'Nepalora',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const faviconUrl = settings?.favicon_url || '/favicon.ico'

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sfProText.variable} ${sfProDisplay.variable} ${sfUiText.variable} ${sfUiDisplay.variable} ${caveatFont.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Dynamic Favicon & Touch Icons */}
        <link rel="icon" href={faviconUrl} sizes="any" />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />

        {settings?.google_site_verification && (
          <meta name="google-site-verification" content={settings.google_site_verification} />
        )}
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-bg text-ink transition-colors duration-200"
      >
        {/* Google Analytics GA4 (Connected to site_settings) */}
        {settings?.google_analytics_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.google_analytics_id}');
              `}
            </Script>
          </>
        )}

        {/* Google AdSense Script (Connected to site_settings) */}
        {settings?.adsense_client_id && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsense_client_id}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}

        {isSiteActive && <BulletinBanner bulletins={bulletins} />}
        <Header isMaintenance={!isSiteActive} settings={settings} />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
          <SiteMaintenanceGate isActive={isSiteActive}>
            {children}
          </SiteMaintenanceGate>
        </main>
        <Footer isMaintenance={!isSiteActive} settings={settings} />
        <ScrollToTop />
      </body>
    </html>
  )
}
