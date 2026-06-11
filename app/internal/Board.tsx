'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, X, Check, ChevronDown, Trash2, Circle,
} from 'lucide-react'
import type { Phase, Task, Blocker, Activity, PhaseStatus, ProgressSnapshot } from '@/lib/types'
import { TRACKS } from '@/lib/types'
import { phaseHealth, expectedPercent, todayDayIndex, daysToGoLive } from '@/lib/health'
import Burndown from '@/components/Burndown'
import Sidebar from './Sidebar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}

const STATUS_META: Record<PhaseStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'var(--text-muted)' },
  in_progress: { label: 'In Progress', color: 'var(--accent-teal)' },
  delivered: { label: 'Delivered', color: 'var(--status-green)' },
  blocked: { label: 'Blocked', color: 'var(--status-red)' },
}

async function api(path: string, method: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

interface BoardProps {
  phases: Phase[]
  tasks: Task[]
  blockers: Blocker[]
  activity: Activity[]
  snapshots: ProgressSnapshot[]
  lastSync: { synced_at: string; source: string } | null
  shareUrl: string
  today: string
}

export default function Board({ phases, tasks, blockers, activity, snapshots, lastSync, shareUrl, today }: BoardProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [live, setLive] = useState(true)

  // Live auto-refresh: re-pull server data every 45s while the tab is visible.
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, 45_000)
    return () => clearInterval(id)
  }, [live, router])

  const tasksByPhase = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      const arr = m.get(t.phase_id) ?? []
      arr.push(t)
      m.set(t.phase_id, arr)
    }
    return m
  }, [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return phases.filter((p) => {
      if (trackFilter !== 'all' && p.track !== trackFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (q && !`${p.internal_name} ${p.owner ?? ''} ${p.ship_tag ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [phases, search, trackFilter, statusFilter])

  // KPIs (over all phases, not filtered)
  const kpis = useMemo(() => {
    const delivered = phases.filter((p) => p.status === 'delivered').length
    const inProgress = phases.filter((p) => p.status === 'in_progress').length
    const atRisk = phases.filter((p) => {
      const h = phaseHealth(p, today).health
      return h === 'at_risk' || h === 'behind'
    }).length
    const overall = phases.length ? Math.round(phases.reduce((s, p) => s + p.percent, 0) / phases.length) : 0
    const openBlockers = blockers.filter((b) => b.status === 'open').length
    return { delivered, inProgress, atRisk, overall, openBlockers, total: phases.length }
  }, [phases, blockers, today])

  const countdown = daysToGoLive(today)

  return (
    <div className="lg:flex">
      <Sidebar shareUrl={shareUrl} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      {/* Page header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4" id="overview">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <button
              onClick={() => setLive((v) => !v)}
              className="inline-flex items-center gap-1.5"
              title={live ? 'Live auto-refresh on (every 45s)' : 'Auto-refresh paused'}
            >
              <span
                className={`h-2 w-2 rounded-full ${live ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: live ? 'var(--status-green)' : 'var(--text-muted)' }}
              />
              {live ? 'Live' : 'Paused'}
            </button>
            <span>·</span>
            <span>Last sync: {lastSync ? `${fmtDateTime(lastSync.synced_at)} (${lastSync.source})` : 'never'}</span>
          </p>
        </div>
      </header>

      {/* KPI cards */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Overall" value={`${kpis.overall}%`} accent="var(--accent-teal)" />
        <Kpi label="Delivered" value={`${kpis.delivered}/${kpis.total}`} accent="var(--status-green)" />
        <Kpi label="In progress" value={String(kpis.inProgress)} accent="var(--accent-teal)" />
        <Kpi label="At risk / behind" value={String(kpis.atRisk)} accent={kpis.atRisk ? 'var(--status-red)' : 'var(--text-muted)'} />
        <Kpi label="Open blockers" value={String(kpis.openBlockers)} accent={kpis.openBlockers ? 'var(--status-yellow)' : 'var(--text-muted)'} />
        <Kpi
          label="To go-live"
          value={countdown >= 0 ? `${countdown}d` : 'past'}
          accent={countdown <= 7 ? 'var(--status-yellow)' : 'var(--text-muted)'}
        />
      </section>

      {/* Gantt */}
      <Gantt phases={phases} today={today} />

      {/* Progress over time */}
      <section id="progress" className="mb-8 scroll-mt-20 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Progress over time
        </h2>
        <Burndown snapshots={snapshots} today={today} />
      </section>

      {/* Filters */}
      <section className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phases, owners, tags…"
            className="w-64 rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]"
          />
        </div>
        <Chips
          value={trackFilter}
          onChange={setTrackFilter}
          options={[{ key: 'all', label: 'All tracks' }, ...TRACKS]}
        />
        <Chips
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { key: 'all', label: 'All status' },
            { key: 'in_progress', label: 'In progress' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'blocked', label: 'Blocked' },
            { key: 'not_started', label: 'Not started' },
          ]}
        />
      </section>

      {/* Swimlanes */}
      <section id="board" className="mb-10 scroll-mt-20 space-y-8">
        {TRACKS.map((track) => {
          const lane = filtered.filter((p) => p.track === track.key)
          if (lane.length === 0) return null
          return (
            <div key={track.key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {track.label}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lane.map((p) => (
                  <PhaseCard key={p.id} phase={p} tasks={tasksByPhase.get(p.id) ?? []} today={today} />
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">No phases match your filters.</p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <BlockerPanel blockers={blockers} />
        <ActivityFeed activity={activity} />
      </div>
      </main>
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card-hover rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4">
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  )
}

function Chips({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="rounded-full border px-3 py-1 text-xs transition"
          style={{
            borderColor: value === o.key ? 'var(--accent-teal)' : 'var(--bg-border)',
            color: value === o.key ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: value === o.key ? 'color-mix(in srgb, var(--accent-teal) 18%, transparent)' : 'transparent',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Gantt({ phases, today }: { phases: Phase[]; today: string }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const todayIdx = todayDayIndex(today)
  const showToday = todayIdx >= 1 && todayIdx <= 30
  const todayLeft = ((todayIdx - 0.5) / 30) * 100

  return (
    <section id="timeline" className="mb-8 scroll-mt-20 overflow-x-auto rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Timeline — Day 1 to 30
      </h2>
      <div className="flex min-w-[760px]">
        {/* Labels */}
        <div className="w-[180px] shrink-0">
          <div className="h-5" />
          {phases.map((p) => (
            <div key={p.id} className="flex h-7 items-center truncate pr-3 text-xs text-[var(--text-primary)]" title={p.internal_name}>
              {p.internal_name}
            </div>
          ))}
        </div>
        {/* Bars */}
        <div className="relative flex-1">
          <div className="grid h-5" style={{ gridTemplateColumns: 'repeat(30, minmax(0,1fr))' }}>
            {days.map((d) => (
              <div key={d} className="text-center text-[10px] text-[var(--text-muted)]">
                {d % 5 === 0 || d === 1 ? d : ''}
              </div>
            ))}
          </div>
          {phases.map((p) => {
            const h = phaseHealth(p, today)
            return (
              <div key={p.id} className="grid h-7 items-center" style={{ gridTemplateColumns: 'repeat(30, minmax(0,1fr))' }}>
                <div
                  className="h-5 rounded transition-all"
                  style={{
                    gridColumnStart: p.start_day,
                    gridColumnEnd: p.end_day + 1,
                    backgroundColor: h.color,
                    opacity: 0.85,
                  }}
                  title={`${fmtDay(p.start_date)} – ${fmtDay(p.end_date)} · ${h.label} · ${p.percent}%`}
                />
              </div>
            )
          })}
          {showToday && (
            <div className="pointer-events-none absolute top-0 bottom-0 z-10" style={{ left: `${todayLeft}%` }}>
              <div className="h-full w-px" style={{ backgroundColor: 'var(--status-yellow)' }} />
              <span
                className="absolute -top-0 -translate-x-1/2 rounded px-1 text-[9px] font-semibold"
                style={{ backgroundColor: 'var(--status-yellow)', color: '#000' }}
              >
                TODAY
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PhaseCard({ phase, tasks, today }: { phase: Phase; tasks: Task[]; today: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [status, setStatus] = useState<PhaseStatus>(phase.status)
  const [owner, setOwner] = useState(phase.owner ?? '')
  const [percent, setPercent] = useState(phase.percent)
  const [previewUrl, setPreviewUrl] = useState(phase.preview_url ?? '')

  const h = phaseHealth(phase, today)
  const sm = STATUS_META[phase.status]
  const expected = expectedPercent(phase, today)
  const doneCount = tasks.filter((t) => t.done).length

  async function refresh() {
    router.refresh()
  }

  async function addTask() {
    if (!newTask.trim()) return
    setBusy(true)
    await api('/api/internal/tasks', 'POST', { phase_id: phase.id, title: newTask })
    setNewTask('')
    setBusy(false)
    refresh()
  }
  async function toggleTask(t: Task) {
    setBusy(true)
    await api('/api/internal/tasks', 'PATCH', { id: t.id, done: !t.done })
    setBusy(false)
    refresh()
  }
  async function deleteTask(t: Task) {
    setBusy(true)
    await api(`/api/internal/tasks?id=${t.id}`, 'DELETE')
    setBusy(false)
    refresh()
  }
  async function savePhase() {
    setBusy(true)
    await api('/api/internal/phases', 'PATCH', { id: phase.id, status, owner, percent, preview_url: previewUrl })
    setBusy(false)
    refresh()
  }

  return (
    <article className="card-hover rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4" style={{ borderColor: phase.status === 'in_progress' ? 'color-mix(in srgb, var(--accent-teal) 40%, var(--bg-border))' : undefined }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${phase.status === 'in_progress' ? 'pulse-dot' : ''}`} style={{ backgroundColor: h.color }} title={h.label} />
          <h3 className="text-sm font-medium leading-snug text-[var(--text-primary)]">{phase.internal_name}</h3>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: sm.color + '22', color: sm.color }}>
          {sm.label}
        </span>
      </div>

      <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-border)]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${phase.percent}%`, backgroundColor: sm.color }} />
      </div>
      <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{phase.percent}% · {h.label}</span>
        <span>expected {expected}%</span>
      </div>

      <dl className="space-y-1 text-xs text-[var(--text-muted)]">
        <Row k="Owner" v={phase.owner ?? '—'} />
        <Row k="Days" v={`${phase.start_day}–${phase.end_day} (${fmtDay(phase.start_date)} – ${fmtDay(phase.end_date)})`} />
        <Row k="Ship tag" v={phase.ship_tag ?? '—'} mono />
        {tasks.length > 0 && <Row k="Tasks" v={`${doneCount}/${tasks.length} done`} />}
      </dl>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--accent-teal)] hover:underline"
      >
        <ChevronDown size={13} className={open ? 'rotate-180 transition' : 'transition'} />
        {open ? 'Hide details' : 'Tasks & edit'}
      </button>

      {open && (
        <div className="mt-3 space-y-4 border-t border-[var(--bg-border)] pt-3">
          {/* Tasks */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tasks</div>
            <ul className="space-y-1">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-2 text-sm">
                  <button onClick={() => toggleTask(t)} disabled={busy} className="shrink-0">
                    {t.done ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded border" style={{ backgroundColor: 'var(--status-green)', borderColor: 'var(--status-green)' }}>
                        <Check size={11} color="#000" />
                      </span>
                    ) : (
                      <Circle size={16} className="text-[var(--text-muted)]" />
                    )}
                  </button>
                  <span className={t.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}>{t.title}</span>
                  <button onClick={() => deleteTask(t)} disabled={busy} className="ml-auto opacity-0 transition group-hover:opacity-100">
                    <Trash2 size={13} className="text-[var(--text-muted)] hover:text-[var(--status-red)]" />
                  </button>
                </li>
              ))}
              {tasks.length === 0 && <li className="text-xs text-[var(--text-muted)]">No tasks yet.</li>}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task…"
                className="flex-1 rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]"
              />
              <button onClick={addTask} disabled={busy} className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50">
                <Plus size={13} /> Add
              </button>
            </div>
            {tasks.length > 0 && (
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">% auto-computes from task completion.</p>
            )}
          </div>

          {/* Edit */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Edit phase</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[var(--text-muted)]">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PhaseStatus)}
                  className="mt-1 w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
                >
                  {(Object.keys(STATUS_META) as PhaseStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--text-muted)]">
                Percent
                <input
                  type="number" min={0} max={100} value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
                />
              </label>
              <label className="col-span-2 text-xs text-[var(--text-muted)]">
                Owner
                <input
                  value={owner} onChange={(e) => setOwner(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
                />
              </label>
              <label className="col-span-2 text-xs text-[var(--text-muted)]">
                Live build URL (client can test) — https only
                <input
                  value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://preview.example.com"
                  className="mt-1 w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
                />
              </label>
            </div>
            <button onClick={savePhase} disabled={busy} className="mt-2 rounded-md bg-[var(--accent-teal)] px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt>{k}</dt>
      <dd className={mono ? 'font-mono text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{v}</dd>
    </div>
  )
}

function BlockerPanel({ blockers }: { blockers: Blocker[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [owner, setOwner] = useState('')
  const [neededBy, setNeededBy] = useState('')

  async function toggle(b: Blocker) {
    setBusy(true)
    await api('/api/internal/blockers', 'PATCH', { id: b.id, status: b.status === 'open' ? 'resolved' : 'open' })
    setBusy(false)
    router.refresh()
  }
  async function remove(b: Blocker) {
    setBusy(true)
    await api(`/api/internal/blockers?id=${b.id}`, 'DELETE')
    setBusy(false)
    router.refresh()
  }
  async function add() {
    if (!label.trim() || !owner.trim()) return
    setBusy(true)
    await api('/api/internal/blockers', 'POST', { label, owner, needed_by: neededBy })
    setLabel(''); setOwner(''); setNeededBy(''); setAdding(false)
    setBusy(false)
    router.refresh()
  }

  return (
    <section id="blockers" className="scroll-mt-20">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Blockers</h2>
        <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-1 text-xs text-[var(--accent-teal)] hover:underline">
          {adding ? <X size={13} /> : <Plus size={13} />} {adding ? 'Cancel' : 'Add'}
        </button>
      </div>

      {adding && (
        <div className="mb-3 space-y-2 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Blocker description"
            className="w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]" />
          <div className="flex gap-2">
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner"
              className="flex-1 rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]" />
            <input value={neededBy} onChange={(e) => setNeededBy(e.target.value)} placeholder="Needed by"
              className="flex-1 rounded-md border border-[var(--bg-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-teal)]" />
          </div>
          <button onClick={add} disabled={busy} className="rounded-md bg-[var(--accent-primary)] px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Add blocker</button>
        </div>
      )}

      <ul className="space-y-2">
        {blockers.map((b) => (
          <li key={b.id} className="group flex items-center gap-3 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3">
            <button onClick={() => toggle(b)} disabled={busy} className="shrink-0" title="Toggle resolved">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.status === 'open' ? 'var(--status-red)' : 'var(--status-green)' }} />
            </button>
            <div className="min-w-0">
              <div className="text-sm text-[var(--text-primary)]">{b.label}</div>
              <div className="text-xs text-[var(--text-muted)]">{b.owner}{b.needed_by ? ` · needed by ${b.needed_by}` : ''}</div>
            </div>
            <span className="ml-auto text-xs capitalize text-[var(--text-muted)]">{b.status}</span>
            <button onClick={() => remove(b)} disabled={busy} className="opacity-0 transition group-hover:opacity-100">
              <Trash2 size={13} className="text-[var(--text-muted)] hover:text-[var(--status-red)]" />
            </button>
          </li>
        ))}
        {blockers.length === 0 && <li className="text-sm text-[var(--text-muted)]">No blockers recorded.</li>}
      </ul>
    </section>
  )
}

function ActivityFeed({ activity }: { activity: Activity[] }) {
  return (
    <section id="activity" className="scroll-mt-20">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Activity (raw — internal only)
      </h2>
      <ul className="space-y-2">
        {activity.map((a) => (
          <li key={a.id} className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="rounded bg-[var(--bg-border)] px-1.5 py-0.5 font-mono">{a.kind}</span>
              {a.phase_id && <span>{a.phase_id}</span>}
              <span className="ml-auto">{fmtDateTime(a.occurred_at)}</span>
            </div>
            <div className="mt-1 text-sm text-[var(--text-primary)]">
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">{a.raw_message}</a>
              ) : a.raw_message}
            </div>
          </li>
        ))}
        {activity.length === 0 && (
          <li className="text-sm text-[var(--text-muted)]">No activity yet — push a tag or run Re-sync.</li>
        )}
      </ul>
    </section>
  )
}
