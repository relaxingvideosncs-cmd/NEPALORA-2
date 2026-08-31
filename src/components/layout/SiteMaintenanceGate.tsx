'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Hammer } from 'lucide-react'

interface SiteMaintenanceGateProps {
  isActive: boolean
  children: React.ReactNode
}

export function SiteMaintenanceGate({ isActive, children }: SiteMaintenanceGateProps) {
  const pathname = usePathname()

  // Staff and API routes are always accessible even during maintenance
  const isStaffOrApiRoute = pathname?.startsWith('/staff') || pathname?.startsWith('/api')

  if (!isActive && !isStaffOrApiRoute) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6 animate-in fade-in-0 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-hairline flex items-center justify-center mx-auto shadow-sm">
          <span className="text-3xl">🏔️</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
            Site is under scheduled maintenance.
          </h1>
          <p className="text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
            We are performing scheduled updates and refinements. All public guides and sections will return shortly.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
          <Hammer className="w-4 h-4 text-accent-red animate-pulse" />
          <span>Scheduled refinement in progress</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
