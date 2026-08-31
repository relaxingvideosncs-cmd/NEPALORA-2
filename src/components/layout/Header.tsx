'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Search, Menu, X, ArrowUpRight } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { SiteSettingsRecord } from '@/types/database'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { StaffHeader } from '@/components/layout/StaffHeader'

interface HeaderProps {
  isMaintenance?: boolean
  settings?: SiteSettingsRecord | null
}

function PublicHeader({ isMaintenance = false, settings }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

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

  const showNav = !isMaintenance

  const navLinks = [
    { href: '/prepare-for-nepal', label: 'Preparation for Nepal' },
    { href: '/trekking-adventure', label: 'Trekking' },
    { href: '/recovery-healing', label: 'Recovery & Healing' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/about', label: 'About' },
  ]

  const brandName = settings?.brand_name || 'Nepalora'
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

              {/* Dark / Light Mode Toggle */}
              <ThemeToggle />

              {/* Mobile Hamburger Trigger (Accessible 44px min tap target) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="
                  md:hidden min-h-[44px] min-w-[44px] p-2 rounded-pill
                  border border-hairline bg-bg-elevated text-ink
                  hover:bg-bg transition-colors flex items-center justify-center
                  active:scale-95 shadow-2xs cursor-pointer
                "
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          )}
        </div>
      </header>

      {/* Extreme Ergonomics Mobile Navigation Drawer (Portaled directly into body) */}
      {mounted &&
        createPortal(
          <div
            className={`
              fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md md:hidden
              transition-opacity duration-200 ease-out
              ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className={`
                absolute top-0 right-0 bottom-0 w-4/5 max-w-sm
                bg-bg-elevated border-l border-hairline p-6 shadow-2xl
                flex flex-col justify-between overflow-y-auto
                transition-transform duration-300 ease-out
                ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <span className="font-display font-bold text-lg text-ink">
                    Navigation
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-full text-ink hover:bg-bg flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          block px-4 py-3 rounded-xl text-base font-semibold transition-all min-h-[48px] flex items-center
                          ${
                            isActive
                              ? 'bg-ink text-bg shadow-sm'
                              : 'text-ink-secondary hover:text-ink hover:bg-bg'
                          }
                        `}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Bottom Section */}
              <div className="border-t border-hairline pt-6 space-y-4">
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    flex items-center justify-between p-3.5 rounded-xl
                    bg-bg border border-hairline text-sm font-medium text-ink
                    min-h-[48px]
                  "
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-ink-tertiary" />
                    Search guides
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-ink-tertiary" />
                </Link>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-ink-secondary font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export function Header({ isMaintenance = false, settings }: HeaderProps) {
  const pathname = usePathname()
  const isStaffRoute = pathname?.startsWith('/staff')

  if (isStaffRoute) {
    return <StaffHeader settings={settings} />
  }

  return <PublicHeader isMaintenance={isMaintenance} settings={settings} />
}
