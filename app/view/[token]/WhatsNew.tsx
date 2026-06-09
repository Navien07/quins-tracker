'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

const KEY = 'quins_client_last_seen'

/** Brand-safe "new since last visit" banner. Uses localStorage only — no data leaves the browser. */
export default function WhatsNew({ dates }: { dates: string[] }) {
  const [newCount, setNewCount] = useState(0)
  const latestRef = useRef<string | null>(null)

  useEffect(() => {
    if (dates.length === 0) return
    const max = [...dates].sort().at(-1) as string
    latestRef.current = max
    const prev = localStorage.getItem(KEY)
    if (!prev) {
      // First visit — record silently, don't nag.
      localStorage.setItem(KEY, max)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only localStorage after mount
    setNewCount(dates.filter((d) => d > prev).length)
  }, [dates])

  function dismiss() {
    if (latestRef.current) localStorage.setItem(KEY, latestRef.current)
    setNewCount(0)
  }

  if (newCount <= 0) return null

  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{ borderColor: 'var(--accent-teal)', backgroundColor: 'color-mix(in srgb, var(--accent-teal) 12%, transparent)' }}
    >
      <Sparkles size={18} className="shrink-0" style={{ color: 'var(--accent-teal)' }} />
      <p className="text-sm text-[var(--text-primary)]">
        <span className="font-semibold">{newCount}</span> new update{newCount > 1 ? 's' : ''} since your last visit.
      </p>
      <button
        onClick={dismiss}
        className="ml-auto rounded-md p-1 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
