import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Megaphone, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Ad Settings',
}

export default async function AdSettingsPage() {
  const supabase = await createClient()

  let adSlots: any[] = []
  try {
    const { data } = await supabase.from('ad_slots').select('*').order('location')
    if (data) adSlots = data
  } catch (err) {
    console.warn('Could not load ad slots:', err)
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div className="border-b border-hairline pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="blue">Monetization Engine</Badge>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Ad Placements & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Zero-layout footprint: Slots render nothing when inactive or unconfigured.
        </p>
      </div>

      <div className="border border-hairline rounded-2xl bg-bg-elevated overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg border-b border-hairline text-ink-tertiary uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Slot Name</th>
                <th className="px-4 py-3">Slug / Identifier</th>
                <th className="px-4 py-3">Page Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-ink">
              {adSlots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-tertiary">
                    Ad slots are registered in database/DB.sql.
                  </td>
                </tr>
              ) : (
                adSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-bg/60">
                    <td className="px-4 py-3 font-semibold text-ink">{slot.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-accent-blue">{slot.slug}</td>
                    <td className="px-4 py-3 capitalize text-ink-secondary">{slot.location}</td>
                    <td className="px-4 py-3 text-ink-tertiary">{slot.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {slot.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink-tertiary font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
