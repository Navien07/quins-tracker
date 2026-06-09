'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function TestNotifyButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch('/api/internal/notify-test', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      const { resend, webhook } = j.result ?? {}
      setMsg(`email: ${resend} · webhook: ${webhook}`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={send}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bg-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-teal)] disabled:opacity-50"
        title="Send a test delivery notification to the configured channels"
      >
        <Mail size={14} />
        {busy ? 'Sending…' : 'Test ping'}
      </button>
      {msg && <span className="text-xs text-[var(--text-muted)]">{msg}</span>}
    </div>
  )
}
