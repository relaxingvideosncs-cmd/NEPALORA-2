import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soulofnepal.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/staff/', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
