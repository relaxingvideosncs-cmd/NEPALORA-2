import { createPublicClient } from '@/lib/supabase/server'
import { SiteSettingsRecord } from '@/types/database'

export async function getSiteSettings(): Promise<SiteSettingsRecord | null> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()

    if (error) {
      console.warn('Could not query site settings:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    return data as SiteSettingsRecord
  } catch (err) {
    console.warn('Could not load site settings exception:', err)
    return null
  }
}
