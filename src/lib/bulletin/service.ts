import { createPublicClient } from '@/lib/supabase/server'
import { BulletinRecord } from '@/types/database'

export async function getActiveBulletins(): Promise<BulletinRecord[]> {
  try {
    const supabase = createPublicClient()
    const nowIso = new Date().toISOString()

    const { data, error } = await supabase
      .from('bulletins')
      .select(`
        *,
        article:articles(title, slug)
      `)
      .eq('is_active', true)
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as BulletinRecord[]
  } catch (err) {
    console.warn('Could not load bulletins:', err)
    return []
  }
}
