import React from 'react'

interface AdSlotProps {
  slug: string
  className?: string
  adConfig?: {
    provider: string
    configuration: Record<string, any>
    is_active: boolean
  } | null
}

export function AdSlot({ slug, className, adConfig }: AdSlotProps) {
  // If no active ad configuration exists, render nothing and consume no layout space
  if (!adConfig || !adConfig.is_active) {
    return null
  }

  return (
    <aside
      className={`my-8 flex justify-center items-center overflow-hidden ${className || ''}`}
      data-ad-slot={slug}
      aria-label="Advertisement"
    >
      {/* Provider-specific rendering abstraction */}
      {adConfig.provider === 'custom_banner' && adConfig.configuration?.imageUrl && (
        <a
          href={adConfig.configuration.targetUrl || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block max-w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={adConfig.configuration.imageUrl}
            alt={adConfig.configuration.altText || 'Sponsor'}
            className="rounded max-w-full h-auto"
          />
        </a>
      )}

      {adConfig.provider === 'html_snippet' && adConfig.configuration?.html && (
        <div
          dangerouslySetInnerHTML={{ __html: adConfig.configuration.html }}
        />
      )}
    </aside>
  )
}
