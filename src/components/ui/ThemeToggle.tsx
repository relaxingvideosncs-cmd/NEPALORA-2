'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('nepalora-theme', next ? 'dark' : 'light')
  }

  if (!mounted) {
    return (
      <div
        className={`h-9 w-16 rounded-pill border border-hairline bg-bg-elevated opacity-0 ${className}`}
        aria-hidden="true"
      />
    )
  }

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={`
        relative inline-flex items-center h-9 w-16 min-h-[44px] min-w-[56px] px-1
        rounded-pill border border-hairline bg-bg-elevated hover:border-hairline-strong
        transition-colors duration-200 cursor-pointer select-none focus-visible:outline-2
        active:scale-[0.96] ${className}
      `}
    >
      <span
        className="
          h-7 w-7 rounded-full bg-ink text-bg
          transition-transform duration-300 ease-out
          flex items-center justify-center shadow-xs pointer-events-none
        "
        style={{ transform: isDark ? 'translateX(26px)' : 'translateX(0)' }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-bg" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-bg" />
        )}
      </span>
    </button>
  )
}
