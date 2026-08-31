'use client'

import React, { useState, useEffect } from 'react'
import {
  Mail,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  FileText,
  Loader2,
  Users,
} from 'lucide-react'
import { NewsletterSubscriberRecord } from '@/types/database'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function ManageSubscribersClientPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/newsletter')
      const data = await res.json()
      if (data.subscribers) {
        setSubscribers(data.subscribers)
      }
    } catch (err) {
      console.warn('Could not fetch subscribers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const handleExportCSV = () => {
    if (subscribers.length === 0) return

    const headers = ['Email', 'Source', 'Article Slug', 'Status', 'Date Joined']
    const rows = subscribers.map((sub) => [
      `"${sub.email}"`,
      `"${sub.source || 'website'}"`,
      `"${sub.article_slug || ''}"`,
      `"${sub.status || 'active'}"`,
      `"${new Date(sub.created_at).toISOString()}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `soul_of_nepal_subscribers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.article_slug && s.article_slug.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">Audience Insights</Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Newsletter Subscribers & Leads
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Audience emails captured through offline PDF guide downloads and newsletter subscriptions.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleExportCSV}
          disabled={subscribers.length === 0}
          className="flex-shrink-0"
        >
          <Download className="w-4 h-4 text-accent-blue" />
          <span>Export {subscribers.length} to CSV</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-bg-elevated border border-hairline rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-tertiary text-xs">
            <span>Total Subscribers</span>
            <Users className="w-4 h-4 text-accent-blue" />
          </div>
          <p className="font-display text-2xl font-bold text-ink">{subscribers.length}</p>
        </div>

        <div className="p-4 bg-bg-elevated border border-hairline rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-tertiary text-xs">
            <span>PDF Guide Downloads</span>
            <FileText className="w-4 h-4 text-accent-red" />
          </div>
          <p className="font-display text-2xl font-bold text-ink">
            {subscribers.filter((s) => s.source === 'download_pdf_guide' || s.source === 'download_guide_pdf').length}
          </p>
        </div>

        <div className="p-4 bg-bg-elevated border border-hairline rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-tertiary text-xs">
            <span>Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-display text-2xl font-bold text-ink">100%</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by email or article slug..."
          className="w-full pl-9 pr-4 py-2.5 min-h-[44px] border border-hairline rounded-pill text-xs text-ink bg-bg-elevated focus:border-hairline-strong focus:outline-none transition-all"
        />
      </div>

      {/* Subscribers Table */}
      {loading ? (
        <div className="py-16 flex justify-center text-ink-tertiary">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
      ) : (
        <div className="border border-hairline rounded-2xl bg-bg-elevated overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg border-b border-hairline text-ink-tertiary uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Subscriber Email</th>
                  <th className="px-4 py-3">Acquisition Source</th>
                  <th className="px-4 py-3">Origin Guide</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-ink-tertiary space-y-2">
                      <Mail className="w-6 h-6 mx-auto text-ink-tertiary" />
                      <p className="font-semibold text-ink">No subscribers captured yet.</p>
                      <p className="text-[11px]">
                        When readers click &quot;Download PDF Guide&quot; on any article and submit their email, they will appear here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-bg/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink font-mono">
                        {sub.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 bg-bg border border-hairline rounded-pill text-ink-secondary text-[10px] font-semibold uppercase">
                          {sub.source || 'website'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-tertiary">
                        {sub.article_slug ? `/${sub.article_slug}` : 'General Newsletter'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="neutral">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Active
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-ink-tertiary font-mono text-[11px]">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3 text-ink-tertiary" />
                          <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
