import { createPublicClient } from '@/lib/supabase/server'
import { SiteSettingsRecord } from '@/types/database'

export function sanitizeSettings(data: Partial<SiteSettingsRecord> | null | undefined): SiteSettingsRecord {
  const d = data || {}
  const isOldBrand = !d.brand_name || d.brand_name === 'Soul of Nepal'
  const isOldTagline = !d.tagline || d.tagline.includes('Soul of Nepal') || d.tagline === 'Independent Nepal Travel, Trekking & Wellness Knowledge Base'
  const isOldDesc = !d.description || d.description.includes('JSON') || d.description.includes('Soul of Nepal')
  const isOldLegal = !d.legal_business_name || d.legal_business_name.includes('Soul of Nepal')

  return {
    ...d,
    brand_name: isOldBrand ? 'Nepalora' : d.brand_name,
    tagline: isOldTagline ? 'The Complete Guide to Nepal Travel, Trekking & Mindful Living' : d.tagline,
    description: isOldDesc
      ? 'Your trusted independent guide to Nepal — expert Himalayan trekking routes, expedition preparation, cultural sanctuaries, and holistic wellness.'
      : d.description,
    legal_business_name: isOldLegal ? 'Nepalora Media & Publishing' : d.legal_business_name,
    website_url: d.website_url && !d.website_url.includes('soulofnepal') ? d.website_url : 'https://nepalora.com',
    email: d.email && !d.email.includes('soulofnepal') ? d.email : 'editorial@nepalora.com',
    support_email: d.support_email && !d.support_email.includes('soulofnepal') ? d.support_email : 'support@nepalora.com',
    seo_title: d.seo_title && !d.seo_title.includes('Soul of Nepal') ? d.seo_title : 'Nepalora — Nepal Travel, Himalayan Trekking & Wellness Guides',
    seo_description:
      d.seo_description && !d.seo_description.includes('JSON') && !d.seo_description.includes('Soul of Nepal')
        ? d.seo_description
        : 'Nepalora is your complete guide to Nepal — expert trekking routes, Himalayan adventure preparation, visa tips, and post-trek wellness. Trusted, independent, and constantly updated.',
  } as SiteSettingsRecord
}

export async function getSiteSettings(): Promise<SiteSettingsRecord | null> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()

    if (error) {
      console.warn('Could not query site settings:', error.message)
      return sanitizeSettings({})
    }

    return sanitizeSettings(data)
  } catch (err) {
    console.warn('Could not load site settings exception:', err)
    return sanitizeSettings({})
  }
}
