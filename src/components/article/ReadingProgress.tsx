'use client'

import React, { useState, useEffect } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        const scrolled = (window.scrollY / scrollHeight) * 100
        setProgress(Math.min(100, Math.max(0, scrolled)))
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  if (progress <= 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-hairline z-50 pointer-events-none">
      <div
        className="h-full transition-all duration-75 ease-out shadow-xs"
        style={{
          width: `${progress}%`,
          backgroundImage: 'var(--accent-gradient)',
        }}
      />
    </div>
  )
}
