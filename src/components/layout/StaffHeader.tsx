'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SiteSettingsRecord } from '@/types/database'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Badge } from '@/components/ui/Badge'
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Images,
  Bell,
  Image as ImageIcon,
  FolderTree,
  Tag,
  Mail,
  Megaphone,
  Settings,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Globe,
} from 'lucide-react'

interface StaffHeaderProps {
  settings?: SiteSettingsRecord | null
}

export function StaffHeader({ settings }: StaffHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    router.push('/staff/login')
    router.refresh()
  }

  const navItems = [
    { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/staff/articles', label: 'Articles', icon: FileText },
    { href: '/staff/import', label: 'Studio', icon: UploadCloud },
    { href: '/staff/galleries', label: 'Galleries', icon: Images },
    { href: '/staff/bulletins', label: 'Bulletins', icon: Bell },
    { href: '/staff/media', label: 'Media', icon: ImageIcon },
    { href: '/staff/categories', label: 'Categories', icon: FolderTree },
    { href: '/staff/tags', label: 'Tags', icon: Tag },
    { href: '/staff/subscribers', label: 'Leads', icon: Mail },
    { href: '/staff/ads', label: 'Ads', icon: Megaphone },
    { href: '/staff/settings', label: 'Settings', icon: Settings },
  ]

  const brandName = settings?.brand_name || 'Nepalora'
  const logoUrl = settings?.full_logo_url || settings?.logo_url

  return (
    <>
      <header
        className={`
          sticky top-0 z-[100] transition-all duration-300 ease-out
          bg-bg-elevated/95 dark:bg-[#111113]/95 backdrop-blur-xl
          border-b border-hairline
          ${scrolled ? 'shadow-sm' : ''}
        `}
        style={{
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        }}
      >
        {/* Top Admin Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-3">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
              title="Back to Nepalora website"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-[38px] sm:h-[44px] max-w-[200px] sm:max-w-[260px] w-auto object-contain py-0.5"
                />
              ) : (
                <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-ink">
                  {brandName}
                </span>
              )}
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-hairline">
              <Badge tone="blue">
                <ShieldCheck className="w-3 h-3 mr-1 text-accent-blue" />
                Admin
              </Badge>
            </div>
          </div>

          {/* Desktop Admin Quick Actions & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Live Site Button */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill
                border border-hairline bg-bg hover:bg-bg-elevated hover:border-hairline-strong
                text-ink text-xs font-semibold transition-all active:scale-95 shadow-2xs
              "
              title="Open live public website in new tab"
            >
              <Globe className="w-3.5 h-3.5 text-accent-blue" />
              <span className="hidden sm:inline">Live Site</span>
              <ArrowUpRight className="w-3 h-3 text-ink-tertiary" />
            </Link>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="
                hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill
                border border-hairline bg-bg hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500
                text-ink-secondary text-xs font-semibold transition-all active:scale-95 cursor-pointer
              "
              title="Sign out of admin portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="
                md:hidden min-h-[44px] min-w-[44px] p-2 rounded-pill
                border border-hairline bg-bg text-ink
                flex items-center justify-center transition-transform active:scale-90
              "
              aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Admin Navigation Bar (Desktop Tabs with Clean Blue Accent) */}
        <div className="hidden md:block border-t border-hairline bg-bg/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center gap-1.5 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== '/staff/dashboard' && pathname?.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all select-none border
                    ${
                      isActive
                        ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 font-bold shadow-2xs'
                        : 'text-ink-secondary hover:text-ink hover:bg-bg-elevated border-transparent font-medium'
                    }
                  `}
                >
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive ? 'text-accent-blue' : 'text-ink-tertiary'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Mobile Admin Navigation Drawer (Portaled) */}
      {mounted &&
        createPortal(
          <div
            className={`
              fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md md:hidden
              transition-opacity duration-200
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
                {/* Header */}
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-accent-blue" />
                    <span className="font-display font-bold text-base text-ink">
                      Admin Console
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-full text-ink hover:bg-bg cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links Grid */}
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/staff/dashboard' && pathname?.startsWith(item.href))

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all border
                          ${
                            isActive
                              ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 font-bold shadow-xs'
                              : 'text-ink-secondary hover:text-ink hover:bg-bg border-transparent font-medium'
                          }
                        `}
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-accent-blue' : 'text-ink-tertiary'
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-hairline pt-4 space-y-3">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-hairline bg-bg text-xs font-semibold text-ink"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent-blue" />
                    View Live Website
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-ink-tertiary" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold cursor-pointer active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Admin</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
