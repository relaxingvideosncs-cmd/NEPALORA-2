'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Search, Menu, X, ArrowUpRight } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { SiteSettingsRecord } from '@/types/database'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface HeaderProps {
  isMaintenance?: boolean
  settings?: SiteSettingsRecord | null
}

export function Header({ isMaintenance = false, settings }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isStaffRoute = pathname?.startsWith('/staff')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect scroll to adjust glass backdrop
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Global keyboard shortcut: '/' or 'Cmd/Ctrl + K' opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault()
        router.push('/search')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const showNav = !isMaintenance || isStaffRoute

  const navLinks = [
    { href: '/prepare-for-nepal', label: 'Preparation for Nepal' },
    { href: '/trekking-adventure', label: 'Trekking' },
    { href: '/recovery-healing', label: 'Recovery & Healing' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/about', label: 'About' },
  ]

  const brandName = settings?.brand_name || 'Soul of Nepal'
  const logoUrl = settings?.full_logo_url || settings?.logo_url

  return (
    <>
      <header
        className={`
          sticky top-0 z-[100] transition-all duration-300 ease-out
          bg-white/70 dark:bg-black/70 backdrop-blur-xl
          border-b border-black/10 dark:border-white/10
          ${scrolled ? 'shadow-sm' : ''}
        `}
        style={{
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        }}
      >
        {/* Refined Navbar Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-[68px] flex items-center justify-between">
          {/* Brand Logo / Title */}
          <Link
            href="/"
            className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink flex items-center gap-2.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandName}
                className="h-[44px] sm:h-[52px] max-w-[260px] sm:max-w-[340px] w-auto object-contain py-0.5"
              />
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl">🏔️</span>
                <span className="font-black tracking-tight">{brandName}</span>
              </span>
            )}
          </Link>

          {showNav ? (
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Desktop Navigation Links with Signature Underline */}
              <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        underline-draw py-1 transition-colors
                        ${isActive ? 'text-ink font-semibold' : 'text-ink-secondary hover:text-ink'}
                      `}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Instant Search Trigger */}
              <Link
                href="/search"
                className="
                  flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1 rounded-pill
                  border border-hairline bg-bg-elevated/80 hover:bg-bg-elevated text-ink-secondary hover:text-ink
                  hover:border-hairline-strong transition-all text-xs font-medium min-h-[38px] sm:min-h-[34px]
                  active:scale-[0.96] shadow-2xs
                "
                title="Instant Search (Press / or ⌘K)"
                aria-label="Search articles and guides"
              >
                <Search className="w-3.5 h-3.5 text-ink-tertiary" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 bg-bg rounded border border-hairline font-mono text-[10px] text-ink-tertiary">
                  /
                </kbd>
              </Link>

              {/* Dark/Light Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Mobile Menu Hamburger Button (Touch Target >= 44px) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                aria-expanded={mobileMenuOpen}
                type="button"
                className="
                  md:hidden flex items-center justify-center w-10 h-10 min-h-[44px] min-w-[44px]
                  rounded-pill border border-hairline bg-bg-elevated text-ink
                  hover:border-hairline-strong transition-all active:scale-[0.94] cursor-pointer
                "
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold px-3.5 py-1 bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-pill">
              Maintenance Mode
            </div>
          )}
        </div>
      </header>

      {/* Full-Screen Mobile Slide-Out Drawer Rendered Directly via Portal to Avoid Ancestor Stacking Traps */}
      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="
              md:hidden fixed inset-0 top-16 z-[99999]
              w-screen h-[calc(100dvh-64px)]
              bg-bg dark:bg-[#0a0a0c] text-ink
              border-t border-hairline
              flex flex-col justify-between p-6 sm:p-8
              overflow-y-auto shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-200
            "
          >
            <nav className="flex flex-col gap-3.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center justify-between p-4.5 rounded-2xl text-base sm:text-lg font-bold
                      border transition-all min-h-[56px] active:scale-[0.98] shadow-xs
                      ${
                        isActive
                          ? 'bg-bg-elevated text-ink border-hairline-strong shadow-sm'
                          : 'bg-bg-elevated/70 text-ink-secondary border-hairline hover:text-ink hover:bg-bg-elevated'
                      }
                    `}
                  >
                    <span className="underline-draw">{link.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-ink-tertiary" />
                  </Link>
                )
              })}

              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="
                  flex items-center gap-3 p-4.5 rounded-2xl text-base sm:text-lg font-bold
                  bg-bg-elevated border border-hairline text-ink min-h-[56px]
                  active:scale-[0.98] shadow-xs hover:border-hairline-strong
                "
              >
                <Search className="w-5 h-5 text-accent-blue" />
                <span>Search All Guides</span>
              </Link>
            </nav>

            <div className="pt-6 border-t border-hairline flex items-center justify-between mt-8">
              <div>
                <span className="text-sm font-semibold text-ink block">Appearance Theme</span>
                <span className="text-xs text-ink-tertiary">Switch between light & dark mode</span>
              </div>
              <ThemeToggle />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
