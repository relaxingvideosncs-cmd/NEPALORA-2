import { NextRequest, NextResponse } from 'next/server'
import { searchArticles } from '@/lib/article/service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const results = await searchArticles(query.trim())

    return NextResponse.json({
      results: results || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Search failed', results: [] }, { status: 500 })
  }
}
