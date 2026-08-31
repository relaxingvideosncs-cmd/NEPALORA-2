import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_SETTINGS_COLUMNS = new Set([
  'brand_name',
  'tagline',
  'description',
  'logo_url',
  'full_logo_url',
  'favicon_url',
  'og_image_url',
  'legal_business_name',
  'business_type',
  'founded_year',
  'email',
  'support_email',
  'phone',
  'whatsapp',
  'country',
  'province',
  'district',
  'city',
  'address',
  'postal_code',
  'website_url',
  'facebook_url',
  'instagram_url',
  'youtube_url',
  'tiktok_url',
  'linkedin_url',
  'x_url',
  'seo_title',
  'seo_description',
  'seo_keywords',
  'google_site_verification',
  'privacy_policy_url',
  'terms_url',
  'disclaimer_url',
  'is_active',
])

import { sanitizeSettings } from '@/lib/settings/service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('GET /api/settings error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: sanitizeSettings(data) })
  } catch (err: any) {
    console.error('GET /api/settings exception:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

async function handleSaveSettings(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    // Find existing row using maybeSingle()
    const { data: existing, error: findError } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (findError && findError.code !== 'PGRST116') {
      console.warn('Error checking existing settings row:', findError.message)
    }

    // Filter payload strictly to valid database columns
    const cleanPayload: Record<string, any> = {}
    for (const [key, value] of Object.entries(body)) {
      if (VALID_SETTINGS_COLUMNS.has(key)) {
        cleanPayload[key] = value
      }
    }
    cleanPayload.updated_at = new Date().toISOString()

    let result
    if (existing?.id) {
      result = await supabase
        .from('site_settings')
        .update(cleanPayload)
        .eq('id', existing.id)
        .select()
        .maybeSingle()
    } else {
      result = await supabase
        .from('site_settings')
        .insert(cleanPayload)
        .select()
        .maybeSingle()
    }

    if (result.error && result.error.code !== 'PGRST116') {
      console.error('Settings save DB error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Resolve saved settings data
    let savedSettings = result.data
    if (!savedSettings) {
      // Re-fetch the saved row
      const { data: refreshed } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle()
      savedSettings = refreshed || { id: existing?.id, ...cleanPayload }
    }

    return NextResponse.json({ success: true, settings: savedSettings })
  } catch (err: any) {
    console.error('Settings update error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return handleSaveSettings(req)
}

export async function PUT(req: NextRequest) {
  return handleSaveSettings(req)
}
