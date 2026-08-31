'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className="
        fixed bottom-6 right-6 z-40 w-12 h-12 min-h-[48px] min-w-[48px]
        rounded-pill glass shadow-md border border-hairline text-ink
        hover:border-hairline-strong transition-all flex items-center justify-center
        active:scale-95 animate-in fade-in-0 duration-200 cursor-pointer
      "
    >
      <ArrowUp className="w-5 h-5 text-ink" />
    </button>
  )
}
