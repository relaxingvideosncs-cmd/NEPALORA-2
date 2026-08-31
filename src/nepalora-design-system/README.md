# Nepalora — Design System

Zero extra dependencies. Everything here is CSS variables, Tailwind config,
and plain React — no framer-motion, no next-themes, no icon library required.

## The concept in one line
Apple's restraint (whitespace, soft shadow, glass on overlays only) +
NYT's editorial structure (hairlines, eyebrows/categories, serif headlines)
— rendered almost entirely in black & white, with your red/blue logo pair
appearing in exactly **three** disciplined places so it reads as premium,
not decorative:

1. The signature drawn underline (`.underline-draw`) on headlines & nav links
2. The `accent` Button variant — one high-intent CTA per screen (e.g. Subscribe)
3. Category badges (`<Badge tone="red">` / `tone="blue"`) for post tags

Everywhere else stays ink-on-paper. That restraint is what makes the accent
pair feel intentional instead of like a template's default two-tone scheme.

## Install (drop-in, ~5 min)
1. Copy `styles/globals.css` → import it in `app/layout.tsx` (or merge tokens
   into your existing globals.css)
2. Copy `tailwind.config.ts` → merge the `theme.extend` block into yours
3. Copy `components/` and `hooks/` and `lib/theme-script.tsx` into your project
4. In `app/layout.tsx`, add `<ThemeScript />` as the first child of `<body>`
5. Wire your already-chosen fonts to `--font-display` / `--font-body` in
   `globals.css` (currently pointing at safe system fallbacks)

## What's included
| File | Purpose |
|---|---|
| `styles/globals.css` | All design tokens (light+dark), hairlines, glass utility, keyframes |
| `tailwind.config.ts` | Tailwind theme wired to the CSS variables |
| `lib/theme-script.tsx` | No-flash dark mode init (runs pre-paint) |
| `components/ui/ThemeToggle.tsx` | The dark mode switch itself |
| `components/ui/Button.tsx` | primary / secondary / ghost / accent variants |
| `components/ui/Badge.tsx` | Category tags |
| `components/ui/PostCard.tsx` | Core article card, with a `featured` variant |
| `components/layout/Navbar.tsx` | Sticky nav, glass-blurs in on scroll |
| `components/layout/Footer.tsx` | Minimal footer |
| `hooks/useScrollReveal.ts` | Staggered fade-up on scroll, IntersectionObserver only |

## Motion rules (so it never feels AI-generated)
- One orchestrated moment per page (scroll reveal on the post grid), not
  animation on every element
- All transitions use `--ease-out` (Apple's spring-like decel curve), 150–500ms
- Hover states are subtle: 4% scale on images, opacity/border shifts on buttons
  — nothing bounces, nothing spins
- `prefers-reduced-motion` is respected globally in `globals.css` — don't
  remove that block

## Extending it
- New page section → wrap the grid in `useScrollReveal()`, give children
  `className="reveal"`
- New CTA → `<Button variant="accent">` — but only use `accent` once per
  screen or the restraint breaks
- Need a modal/command palette later → reuse `.glass` on its surface, same
  as the navbar
