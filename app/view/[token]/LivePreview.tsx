'use client'

import { useState } from 'react'
import { ArrowUpRight, Monitor } from 'lucide-react'

/** Embeds the live build in a browser-style frame, with a shimmer while it loads
 *  and a graceful "open in new tab" fallback if the site blocks embedding. */
export default function LivePreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--bg-border)] px-4 py-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#F85149' }} />
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#D29922' }} />
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#3FB950' }} />
        <div className="mx-3 hidden flex-1 truncate rounded-md bg-[var(--bg-primary)] px-3 py-1 text-xs text-[var(--text-muted)] sm:block">
          {url}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          Open <ArrowUpRight size={13} />
        </a>
      </div>

      {/* Viewport */}
      <div className="relative" style={{ aspectRatio: '16 / 10' }}>
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="shimmer h-full w-full absolute inset-0 opacity-60" />
            <Monitor size={28} className="relative text-[var(--text-muted)]" />
            <p className="relative text-sm text-[var(--text-muted)]">Loading live preview…</p>
          </div>
        )}
        <iframe
          src={url}
          title="Live build preview"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  )
}
