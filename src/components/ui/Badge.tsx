import React from 'react'

export type BadgeTone = 'neutral' | 'red' | 'blue'

export interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-bg-elevated text-ink-secondary border-hairline',
  red: 'bg-accent-red/10 text-accent-red border-accent-red/30 dark:bg-accent-red/15',
  blue: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 dark:bg-accent-blue/15',
}

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center h-6 px-2.5 rounded-pill border text-[10px] sm:text-[11px]
        font-semibold uppercase tracking-wider select-none shrink-0 ${tones[tone]} ${className}
      `}
    >
      {children}
    </span>
  )
}
