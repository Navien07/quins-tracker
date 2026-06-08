'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="truncate rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
        {url}
      </code>
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bg-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-teal)]"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy client link'}
      </button>
    </div>
  )
}
