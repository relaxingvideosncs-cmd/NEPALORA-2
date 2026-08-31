import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bulletins')
      .select('*, article:articles(title, slug)')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bulletins: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch bulletins' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { title, notice, picture_url, article_id, link_url, start_date, end_date, priority, is_active } = body

    if (!title || !notice || !start_date || !end_date) {
      return NextResponse.json({ error: 'Title, notice, start date, and end date are required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bulletins')
      .insert({
        title,
        notice,
        picture_url: picture_url || null,
        article_id: article_id || null,
        link_url: link_url || null,
        start_date,
        end_date,
        priority: Number(priority) || 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, bulletin: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save bulletin' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Bulletin ID is required.' }, { status: 400 })
    }

    const { error } = await supabase.from('bulletins').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete bulletin' }, { status: 500 })
  }
}
