'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export default function ResyncButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function resync() {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch('/api/tracker/resync', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      setMsg(
        `Synced: ${j.summary?.delivered?.length ?? 0} delivered, ${j.summary?.inProgress?.length ?? 0} in progress`
      )
      router.refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={resync}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
        {busy ? 'Re-syncing…' : 'Re-sync now'}
      </button>
      {msg && <span className="text-sm text-[var(--text-muted)]">{msg}</span>}
    </div>
  )
}
