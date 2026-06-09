import { getClientData } from '@/lib/client-data'
import { todayDayIndex } from '@/lib/health'
import WhatsNew from './WhatsNew'
import { CheckCircle2, Clock, CalendarDays, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
function fmtFull(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
function fmtRange(start: string, end: string): string {
  return `${fmtDay(start)} – ${fmtDay(end)}`
}

function statusColor(status: string): string {
  if (status === 'Delivered') return 'var(--status-green)'
  if (status === 'In Progress') return 'var(--accent-teal)'
  return 'var(--text-muted)'
}

function Ring({ percent, size = 120 }: { percent: number; size?: number }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--accent-teal)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-primary)" fontSize={size * 0.22} fontWeight="600">
        {percent}%
      </text>
    </svg>
  )
}

export default async function ClientView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getClientData(token)

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Invalid or expired link</h1>
        <p className="text-[var(--text-muted)]">
          This link is not valid. Please contact your project lead for an up-to-date link.
        </p>
      </main>
    )
  }

  const { phases, milestones, overall, delivered, total, updatedAt, demoUrl } = data
  const today = todayDayIndex(new Date().toISOString().slice(0, 10))
  const showToday = today >= 1 && today <= 30
  const todayLeft = ((today - 0.5) / 30) * 100

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <WhatsNew dates={milestones.map((m) => m.at)} />

      {/* Header */}
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            MyKASIH Command Centre — Phase 2
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] sm:text-base">Target go-live: 7 Jul 2026</p>
          {updatedAt && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">As of {fmtFull(updatedAt)}</p>
          )}
          {demoUrl && (
            <a
              href={demoUrl} target="_blank" rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              View live preview <ArrowUpRight size={15} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <Ring percent={overall} />
          <div className="text-sm text-[var(--text-muted)]">
            <div className="font-medium text-[var(--text-primary)]">Overall progress</div>
            <div>across all workstreams</div>
          </div>
        </div>
      </header>

      {/* Quick stats */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<CheckCircle2 size={16} />} label="Delivered" value={`${delivered} of ${total}`} color="var(--status-green)" />
        <Stat icon={<Clock size={16} />} label="In progress" value={String(phases.filter((p) => p.status === 'In Progress').length)} color="var(--accent-teal)" />
        <Stat icon={<CalendarDays size={16} />} label="Go-live" value="7 Jul 2026" color="var(--text-muted)" />
      </section>

      {/* Delivery timeline (what's shipped) */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-[var(--text-primary)]">What we&rsquo;ve shipped</h2>
        {milestones.length > 0 ? (
          <ol className="relative space-y-4 border-l border-[var(--bg-border)] pl-6">
            {milestones.map((m, i) => (
              <li key={i} className="relative">
                <span
                  className="absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4"
                  style={{ backgroundColor: 'var(--status-green)', boxShadow: '0 0 0 4px var(--bg-primary)' }}
                />
                <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3">
                  <div className="text-[var(--text-primary)]">{m.label}</div>
                  <div className="mt-0.5 text-sm text-[var(--text-muted)]">{fmtFull(m.at)}</div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-4 text-sm text-[var(--text-muted)]">
            No deliveries yet — shipped milestones will appear here as features go live.
          </p>
        )}
      </section>

      {/* Workstream cards */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-[var(--text-primary)]">Workstreams</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {phases.map((p) => (
            <article key={p.name} className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-base font-medium leading-snug text-[var(--text-primary)] sm:text-lg">{p.name}</h3>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: statusColor(p.status) + '22', color: statusColor(p.status) }}
                >
                  {p.status}
                </span>
              </div>
              {p.blurb && <p className="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">{p.blurb}</p>}
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-border)]">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.percent}%`, backgroundColor: statusColor(p.status) }} />
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>{fmtRange(p.start, p.end)}</span>
                <span>{p.percent}%</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Programme timeline (scrolls on mobile) */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium text-[var(--text-primary)]">Programme timeline</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-[150px] shrink-0 sm:w-[200px]">
                <div className="h-5" />
                {phases.map((p) => (
                  <div key={p.name} className="flex h-8 items-center truncate pr-3 text-xs text-[var(--text-primary)]" title={p.name}>
                    {p.name}
                  </div>
                ))}
              </div>
              <div className="relative flex-1">
                <div className="grid h-5 text-[10px] text-[var(--text-muted)]" style={{ gridTemplateColumns: 'repeat(30, minmax(0,1fr))' }}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <div key={d} className="text-center">{d % 5 === 0 || d === 1 ? d : ''}</div>
                  ))}
                </div>
                {phases.map((p) => (
                  <div key={p.name} className="grid h-8 items-center" style={{ gridTemplateColumns: 'repeat(30, minmax(0,1fr))' }}>
                    <div
                      className="h-5 rounded transition-all"
                      style={{ gridColumnStart: p.startDay, gridColumnEnd: p.endDay + 1, backgroundColor: statusColor(p.status), opacity: 0.85 }}
                      title={`${fmtRange(p.start, p.end)} · ${p.status}`}
                    />
                  </div>
                ))}
                {showToday && (
                  <div className="pointer-events-none absolute top-0 bottom-0 z-10" style={{ left: `${todayLeft}%` }}>
                    <div className="h-full w-px" style={{ backgroundColor: 'var(--status-yellow)' }} />
                    <span className="absolute top-0 -translate-x-1/2 rounded px-1 text-[9px] font-semibold" style={{ backgroundColor: 'var(--status-yellow)', color: '#000' }}>
                      TODAY
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-[var(--bg-border)] pt-6 text-center text-sm text-[var(--text-muted)]">
        Prepared by Iceberg AI Solutions
      </footer>
    </main>
  )
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" style={{ color }}>
        {icon}
        <span className="text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}
