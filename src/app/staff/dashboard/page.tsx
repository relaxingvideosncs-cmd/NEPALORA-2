import React from 'react'
import Link from 'next/link'
import {
  FileText,
  UploadCloud,
  Image as ImageIcon,
  FolderTree,
  Tag,
  Megaphone,
  Settings,
  Bell,
  ArrowUpRight,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export const metadata = {
  title: 'Staff Dashboard',
}

export default function StaffDashboardPage() {
  const sections = [
    {
      title: 'Editorial & Articles',
      items: [
        { name: 'Publishing Studio (JSON)', href: '/staff/import', desc: 'Paste JSON, 1-click preview, insert images & publish', icon: UploadCloud, highlight: true },
        { name: 'Manage Articles', href: '/staff/articles', desc: 'View, edit, filter, publish, and delete articles', icon: FileText },
        { name: 'Newsletter & PDF Leads', href: '/staff/subscribers', desc: 'Audience emails captured from PDF downloads', icon: Mail, highlight: true },
      ],
    },
    {
      title: 'Announcements & Media',
      items: [
        { name: 'Gallery Controller', href: '/staff/galleries', desc: 'Control Hero, Home Grid, 3 Polaroids, and Main Gallery', icon: ImageIcon, highlight: true },
        { name: 'Bulletins & Notices', href: '/staff/bulletins', desc: 'Trail advisories and top announcement banners', icon: Bell },
        { name: 'Media Library', href: '/staff/media', desc: 'Cloudinary image uploads and metadata registry', icon: UploadCloud },
      ],
    },
    {
      title: 'Taxonomy',
      items: [
        { name: 'Manage Categories', href: '/staff/categories', desc: 'Prepare, Trekking, and Recovery pillars', icon: FolderTree },
        { name: 'Manage Tags', href: '/staff/tags', desc: 'Article tags and discoverability keywords', icon: Tag },
      ],
    },
    {
      title: 'Configuration & Monetization',
      items: [
        { name: 'Site Settings & Brand', href: '/staff/settings', desc: 'Brand name, logo, social links & contact channels', icon: Settings },
        { name: 'Ad Placements', href: '/staff/ads', desc: 'Configure ad slots and conditional sponsor displays', icon: Megaphone },
      ],
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-6">
      <header className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Editorial Console</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Lightweight publishing platform & content management
          </p>
        </div>
        <Link
          href="/staff/import"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-pill text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
          style={{ backgroundImage: 'var(--accent-gradient)' }}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Publishing Studio</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="border border-hairline rounded-2xl p-5 sm:p-6 bg-bg-elevated space-y-4 shadow-xs"
          >
            <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">
              {sec.title}
            </h2>
            <div className="space-y-2.5">
              {sec.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      block p-3.5 rounded-xl border transition-all min-h-[60px] active:scale-[0.99]
                      ${
                        item.highlight
                          ? 'border-accent-blue/30 bg-accent-blue/5 hover:border-accent-blue/50'
                          : 'border-hairline bg-bg hover:border-hairline-strong'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${item.highlight ? 'text-accent-blue' : 'text-ink-secondary'}`} />
                        <span className="text-xs sm:text-sm font-semibold text-ink underline-draw">{item.name}</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-ink-tertiary" />
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 pl-6.5">{item.desc}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
