import React from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react'
import { BulletinRecord } from '@/types/database'
import { Badge } from '@/components/ui/Badge'

interface NoticeBoardProps {
  bulletins: BulletinRecord[]
}

export function NoticeBoard({ bulletins }: NoticeBoardProps) {
  if (!bulletins || bulletins.length === 0) {
    return null
  }

  return (
    <section className="bg-bg-elevated border border-hairline rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-ink uppercase tracking-wide">
              Live Trail Advisories & Notices
            </h2>
            <p className="text-[11px] text-ink-tertiary">
              Active mountain weather advisories, trail conditions, and seasonal announcements.
            </p>
          </div>
        </div>
        <Badge tone="neutral">
          {bulletins.length} Active {bulletins.length === 1 ? 'Notice' : 'Notices'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bulletins.map((b, idx) => {
          const targetLink = b.article?.slug ? `/article/${b.article.slug}` : b.link_url
          const isTopPriority = idx === 0

          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl border bg-bg flex flex-col justify-between space-y-3 transition-all ${
                isTopPriority ? 'border-accent-red/40 shadow-xs' : 'border-hairline hover:border-hairline-strong'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isTopPriority && (
                      <Badge tone="red">
                        <Sparkles className="w-2.5 h-2.5 mr-1" /> High Priority
                      </Badge>
                    )}
                    <span className="text-[10px] font-mono text-ink-tertiary flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-ink-tertiary" />
                      {new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {b.picture_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.picture_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-hairline mt-0.5"
                    />
                  )}
                  <div className="space-y-1 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-ink leading-snug">
                      {b.title}
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {b.notice}
                    </p>
                  </div>
                </div>
              </div>

              {targetLink && (
                <div className="pt-2 border-t border-hairline flex items-center justify-end">
                  {b.article ? (
                    <Link
                      href={targetLink}
                      className="text-xs font-semibold text-accent-red hover:underline flex items-center gap-1 py-1 min-h-[36px]"
                    >
                      <span>Read Connected Guide</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <a
                      href={targetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-accent-blue hover:underline flex items-center gap-1 font-mono text-[11px] py-1 min-h-[36px]"
                    >
                      <span>View Advisory Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
