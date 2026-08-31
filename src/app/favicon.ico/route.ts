import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/settings/service'

export const revalidate = 86400

export async function GET() {
  try {
    const settings = await getSiteSettings()

    if (settings?.favicon_url) {
      // Fetch the actual favicon image and proxy it with proper cache and content-type headers
      const res = await fetch(settings.favicon_url)
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/png'
        const arrayBuffer = await res.arrayBuffer()

        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=60, s-maxage=60',
          },
        })
      }

      // If fetch fails, redirect directly to Cloudinary URL
      return NextResponse.redirect(settings.favicon_url, 307)
    }
  } catch (err) {
    console.warn('Dynamic favicon error:', err)
  }

  // Fallback default SVG mountain icon if no favicon is uploaded yet
  const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#d97706"/>
    <path d="M16 6 L26 24 L6 24 Z" fill="#ffffff"/>
    <path d="M16 6 L20 13 L16 16 L12 13 Z" fill="#fef3c7"/>
  </svg>`

  return new NextResponse(defaultSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
