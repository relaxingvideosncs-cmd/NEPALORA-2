'use client'

import { useEffect, useRef } from 'react'

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(staggerMs = 60) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const children = Array.from(node.children) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            children.forEach((child, i) => {
              child.style.animationDelay = `${i * staggerMs}ms`
            })
            observer.unobserve(node)
          }
        })
      },
      { threshold: 0.05, rootMargin: '50px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [staggerMs])

  return ref
}
