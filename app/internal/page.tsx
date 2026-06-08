import { headers } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import ResyncButton from './ResyncButton'
import CopyLink from './CopyLink'
import SignOutButton from './SignOutButton'

export const dynamic = 'force-dynamic'

type Phase = {
  id: string
  internal_name: string
  track: string
  start_day: number
  end_day: number
  start_date: string
  end_date: string
  ship_tag: string | null
  status: string
  percent: number
  owner: string | null
  sort_order: number
}

type Blocker = {
  id: string
  label: string
  owner: string
  needed_by: string | null
  status: string
}

type Activity = {
  id: string
  phase_id: string | null
  kind: string
  raw_message: string
  url: string | null
  occurred_at: string
}

const TRACKS: { key: string; label: string }[] = [
  { key: 'core', label: 'Core Track' },
  { key: 'parallel_a', label: 'Parallel A' },
  { key: 'parallel_b', label: 'Parallel B' },
  { key: 'parallel_c', label: 'Parallel C' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}

function statusStyle(status: string): { bg: string; fg: string; label: string } {
  switch (status) {
    case 'delivered':
      return { bg: 'var(--status-green)', fg: 'var(--status-green)', label: 'Delivered' }
    case 'in_progress':
      return { bg: 'var(--accent-teal)', fg: 'var(--accent-teal)', label: 'In Progress' }
    case 'blocked':
      return { bg: 'var(--status-red)', fg: 'var(--status-red)', label: 'Blocked' }
    default:
      return { bg: 'var(--text-muted)', fg: 'var(--text-muted)', label: 'Not Started' }
  }
}

export default async function InternalBoard() {
  const supabase = await createSupabaseServer()

  const [{ data: phasesData }, { data: blockersData }, { data: activityData }, { data: syncData }] =
    await Promise.all([
      supabase.from('phases').select('*').order('sort_order'),
      supabase.from('blockers').select('*').order('created_at'),
      supabase.from('activity').select('*').order('occurred_at', { ascending: false }).limit(40),
      supabase.from('sync_log').select('synced_at,source').order('synced_at', { ascending: false }).limit(1),
    ])

  const phases = (phasesData ?? []) as Phase[]
  const blockers = (blockersData ?? []) as Blocker[]
  const activity = (activityData ?? []) as Activity[]
  const lastSync = syncData?.[0] as { synced_at: string; source: string } | undefined

  const token = process.env.CLIENT_SHARE_TOKEN ?? ''
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const shareUrl = `${proto}://${host}/view/${token}`

  const days = Array.from({ length: 30 }, (_, i) => i + 1)

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Quins Tracker — Internal Board
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Last sync:{' '}
            {lastSync ? `${fmtDateTime(lastSync.synced_at)} (${lastSync.source})` : 'never'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <ResyncButton />
            <SignOutButton />
          </div>
          <CopyLink url={shareUrl} />
        </div>
      </header>

      {/* Gantt timeline */}
      <section className="mb-10 overflow-x-auto rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Timeline — Day 1 to 30
        </h2>
        <div className="min-w-[760px]">
          {/* Day ruler */}
          <div
            className="mb-2 grid items-center gap-px text-[10px] text-[var(--text-muted)]"
            style={{ gridTemplateColumns: `180px repeat(30, minmax(0, 1fr))` }}
          >
            <div />
            {days.map((d) => (
              <div key={d} className="text-center">
                {d % 5 === 0 || d === 1 ? d : ''}
              </div>
            ))}
          </div>
          {phases.map((p) => {
            const st = statusStyle(p.status)
            return (
              <div
                key={p.id}
                className="grid items-center gap-px py-1"
                style={{ gridTemplateColumns: `180px repeat(30, minmax(0, 1fr))` }}
              >
                <div className="truncate pr-3 text-xs text-[var(--text-primary)]" title={p.internal_name}>
                  {p.internal_name}
                </div>
                <div
                  className="h-5 rounded"
                  style={{
                    gridColumnStart: p.start_day + 1,
                    gridColumnEnd: p.end_day + 2,
                    backgroundColor: st.bg,
                    opacity: 0.85,
                  }}
                  title={`${fmtDay(p.start_date)} – ${fmtDay(p.end_date)} · ${st.label} · ${p.percent}%`}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* Swimlanes by track */}
      <section className="mb-10 space-y-8">
        {TRACKS.map((track) => {
          const lanePhases = phases.filter((p) => p.track === track.key)
          if (lanePhases.length === 0) return null
          return (
            <div key={track.key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {track.label}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lanePhases.map((p) => {
                  const st = statusStyle(p.status)
                  return (
                    <article
                      key={p.id}
                      className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium leading-snug text-[var(--text-primary)]">
                          {p.internal_name}
                        </h3>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: st.fg + '22', color: st.fg }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-border)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${p.percent}%`, backgroundColor: st.bg }}
                        />
                      </div>
                      <dl className="space-y-1 text-xs text-[var(--text-muted)]">
                        <div className="flex justify-between">
                          <dt>Owner</dt>
                          <dd className="text-[var(--text-primary)]">{p.owner ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Days</dt>
                          <dd>
                            {p.start_day}–{p.end_day} ({fmtDay(p.start_date)} – {fmtDay(p.end_date)})
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Ship tag</dt>
                          <dd className="font-mono text-[var(--text-primary)]">{p.ship_tag ?? '—'}</dd>
                        </div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Blockers */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Blockers
          </h2>
          <ul className="space-y-2">
            {blockers.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: b.status === 'open' ? 'var(--status-red)' : 'var(--status-green)',
                  }}
                />
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text-primary)]">{b.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {b.owner}
                    {b.needed_by ? ` · needed by ${b.needed_by}` : ''}
                  </div>
                </div>
                <span className="ml-auto text-xs capitalize text-[var(--text-muted)]">{b.status}</span>
              </li>
            ))}
            {blockers.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">No blockers recorded.</li>
            )}
          </ul>
        </section>

        {/* Activity feed */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Activity (raw — internal only)
          </h2>
          <ul className="space-y-2">
            {activity.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="rounded bg-[var(--bg-border)] px-1.5 py-0.5 font-mono">{a.kind}</span>
                  {a.phase_id && <span>{a.phase_id}</span>}
                  <span className="ml-auto">{fmtDateTime(a.occurred_at)}</span>
                </div>
                <div className="mt-1 text-sm text-[var(--text-primary)]">
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {a.raw_message}
                    </a>
                  ) : (
                    a.raw_message
                  )}
                </div>
              </li>
            ))}
            {activity.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">
                No activity yet — push a tag or run Re-sync.
              </li>
            )}
          </ul>
        </section>
      </div>
    </main>
  )
}
