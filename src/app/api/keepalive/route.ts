import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Supabase Keepalive & Healthcheck Endpoint
 *
 * Prevents Supabase free-tier pausing by executing live read queries on schedule.
 * Can be triggered via Vercel Cron, GitHub Actions, or external uptime monitors.
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  // Verify CRON_SECRET if present in authorization header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    // If authorization is provided but doesn't match secret
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch {
      supabase = createPublicClient()
    }

    // Ping site_settings and articles to keep Postgres instance active
    const [settingsRes, articlesRes] = await Promise.all([
      supabase.from('site_settings').select('id, site_name, updated_at').limit(1).maybeSingle(),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
    ])

    const latencyMs = Date.now() - startTime

    if (settingsRes.error && articlesRes.error) {
      return NextResponse.json(
        {
          status: 'error',
          database: 'unhealthy',
          provider: 'supabase',
          error: settingsRes.error?.message || articlesRes.error?.message,
          latency_ms: latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'active',
        database: 'connected',
        provider: 'supabase',
        latency_ms: latencyMs,
        total_articles: articlesRes.count ?? 0,
        site_name: settingsRes.data?.site_name || 'Nepalora',
        timestamp: new Date().toISOString(),
        message: 'Supabase database is active and awake. Keepalive ping successful.',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        provider: 'supabase',
        error: err.message || 'Failed to connect to Supabase',
        latency_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
