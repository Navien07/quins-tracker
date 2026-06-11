'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Calendar, TrendingUp, Layers, AlertCircle, Activity as ActivityIcon, Menu, X,
} from 'lucide-react'
import ResyncButton from './ResyncButton'
import CopyLink from './CopyLink'
import TestNotifyButton from './TestNotifyButton'
import SignOutButton from './SignOutButton'

const NAV = [
  { href: '#overview', label: 'Overview', icon: LayoutDashboard },
  { href: '#timeline', label: 'Timeline', icon: Calendar },
  { href: '#progress', label: 'Progress', icon: TrendingUp },
  { href: '#board', label: 'Workstreams', icon: Layers },
  { href: '#blockers', label: 'Blockers', icon: AlertCircle },
  { href: '#activity', label: 'Activity', icon: ActivityIcon },
]

/** Futura-style app shell sidebar: brand, section nav, actions pinned at the bottom. */
export default function Sidebar({ shareUrl }: { shareUrl: string }) {
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        >
          <Icon size={16} />
          {label}
        </a>
      ))}
    </nav>
  )

  const actions = (
    <div className="space-y-3 border-t border-[var(--bg-border)] p-4">
      <ResyncButton />
      <CopyLink url={shareUrl} />
      <div className="flex items-center justify-between gap-2">
        <TestNotifyButton />
        <SignOutButton />
      </div>
    </div>
  )

  const brand = (
    <div className="flex items-center gap-3 px-5 py-6">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-primary))' }}
      >
        Q
      </div>
      <div>
        <div className="text-sm font-bold text-[var(--text-primary)]">Quins Tracker</div>
        <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Phase 2 Programme</div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="glass sticky top-0 z-40 flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-primary))' }}
          >
            Q
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)]">Quins Tracker</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="rounded-md p-2 text-[var(--text-muted)]" aria-label="Menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="glass fixed inset-x-0 top-[53px] z-40 flex flex-col border-b border-[var(--bg-border)] pb-2 lg:hidden">
          {nav}
          {actions}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--bg-border)] bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)] lg:flex">
        {brand}
        {nav}
        {actions}
      </aside>
    </>
  )
}
