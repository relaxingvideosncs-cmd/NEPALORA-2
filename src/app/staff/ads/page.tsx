import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, XCircle, Megaphone } from 'lucide-react'
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

      {/* Mobile Card List (Screens < 640px) */}
      <div className="block sm:hidden space-y-3">
        {adSlots.length === 0 ? (
          <div className="p-8 border border-dashed border-hairline rounded-2xl text-center text-ink-tertiary bg-bg-elevated space-y-2">
            <Megaphone className="w-6 h-6 mx-auto text-ink-tertiary" />
            <p className="font-semibold text-ink">No ad slots registered.</p>
          </div>
        ) : (
          adSlots.map((slot) => (
            <div
              key={slot.id}
              className="p-4 rounded-2xl border border-hairline bg-bg-elevated shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 bg-bg border border-hairline rounded-pill text-ink-secondary text-[10px] font-semibold uppercase">
                  {slot.location}
                </span>
                {slot.is_active ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-ink-tertiary font-semibold text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Inactive
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-display font-bold text-sm text-ink">{slot.name}</h3>
                <p className="text-[11px] text-accent-blue font-mono mt-0.5">{slot.slug}</p>
              </div>

              {slot.description && (
                <p className="text-xs text-ink-secondary pt-1 border-t border-hairline">
                  {slot.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (Screens >= 640px) */}
      <div className="hidden sm:block border border-hairline rounded-2xl bg-bg-elevated overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/80 border-b border-hairline text-ink-tertiary uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Slot Name</th>
                <th className="px-5 py-3.5">Slug / Identifier</th>
                <th className="px-5 py-3.5">Page Location</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-ink">
              {adSlots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-tertiary space-y-2">
                    <Megaphone className="w-6 h-6 mx-auto text-ink-tertiary" />
                    <p className="font-semibold text-ink">No ad slots registered.</p>
                  </td>
                </tr>
              ) : (
                adSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-ink">{slot.name}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-accent-blue">{slot.slug}</td>
                    <td className="px-5 py-4 capitalize text-ink-secondary">
                      <span className="px-2.5 py-1 bg-bg border border-hairline rounded-pill text-ink font-medium text-[11px]">
                        {slot.location}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary text-xs">{slot.description || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      {slot.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink-tertiary font-semibold text-xs">
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
