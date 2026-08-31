import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, article_slug, source = 'download_guide_pdf' } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email: trimmedEmail,
          source,
          article_slug: article_slug || null,
          status: 'active',
        },
        { onConflict: 'email' }
      )
      .select()
      .single()

    if (error) {
      console.warn('Newsletter subscribe warning (if table not created yet):', error.message)
      // Even if database has not had the SQL run yet, return success to not block user's PDF download
      return NextResponse.json({ success: true, message: 'Subscribed successfully.' })
    }

    return NextResponse.json({ success: true, subscriber: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ subscribers: [] })
    }

    return NextResponse.json({ subscribers: data || [] })
  } catch {
    return NextResponse.json({ subscribers: [] })
  }
}
