"use client";

import { useEffect, useRef } from "react";

// Pairs with the .reveal class in globals.css. Staggers children
// on scroll into view — no framer-motion, no GSAP, just the
// browser's native IntersectionObserver (~20 lines).
//
// Usage: const ref = useScrollReveal(); <div ref={ref}>...</div>
// Give each direct child className="reveal" and it'll fade up
// staggered by 60ms as the container enters the viewport.

export function useScrollReveal<T extends HTMLElement>(staggerMs = 60) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const children = Array.from(node.children) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            children.forEach((child, i) => {
              child.style.animationDelay = `${i * staggerMs}ms`;
            });
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [staggerMs]);

  return ref;
}
