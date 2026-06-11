import { getClientData } from '@/lib/client-data'
import { todayDayIndex } from '@/lib/health'
import WhatsNew from './WhatsNew'
import LivePreview from './LivePreview'
import AnimatedRing from '@/components/AnimatedRing'
import Reveal from '@/components/Reveal'
import { CheckCircle2, Clock, CalendarDays, ArrowUpRight, Rocket, ChevronRight, Check } from 'lucide-react'

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
  const inProgress = phases.filter((p) => p.status === 'In Progress').length

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero with animated aurora */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--bg-border)] px-5 py-8 sm:px-8 sm:py-10">
        <div className="aurora" />
        <div className="relative z-10">
          <WhatsNew dates={milestones.map((m) => m.at)} />
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-up">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--bg-border)] bg-[var(--bg-surface)]/60 px-3 py-1 text-xs text-[var(--text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ backgroundColor: 'var(--status-green)' }} />
                Live delivery tracker
              </div>
              <h1 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
                MyKASIH Command Centre
              </h1>
              <p className="mt-1 text-lg font-medium text-[var(--text-primary)]">Phase 2 Programme</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Target go-live: 7 Jul 2026</p>
              {updatedAt && <p className="mt-1 text-xs text-[var(--text-muted)]">As of {fmtFull(updatedAt)}</p>}
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Rocket size={15} /> View live preview <ArrowUpRight size={14} />
                </a>
              )}
            </div>
            <div className="flex items-center gap-4 self-start sm:self-auto">
              <AnimatedRing percent={overall} />
              <div className="text-sm text-[var(--text-muted)]">
                <div className="font-semibold text-[var(--text-primary)]">Overall progress</div>
                <div>across all workstreams</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<CheckCircle2 size={16} />} label="Delivered" value={`${delivered} of ${total}`} color="var(--status-green)" delay={0} />
        <Stat icon={<Clock size={16} />} label="In progress" value={String(inProgress)} color="var(--accent-teal)" delay={80} />
        <Stat icon={<CalendarDays size={16} />} label="Go-live" value="7 Jul 2026" color="var(--text-muted)" delay={160} />
      </section>

      {/* Live build preview */}
      {demoUrl && (
        <Reveal className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Live build preview</h2>
          <LivePreview url={demoUrl} />
        </Reveal>
      )}

      {/* What's shipped */}
      <Reveal className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">What we&rsquo;ve shipped</h2>
        {milestones.length > 0 ? (
          <ol className="relative space-y-4 border-l border-[var(--bg-border)] pl-6">
            {milestones.map((m, i) => (
              <li key={i} className="relative">
                <span
                  className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full"
                  style={{ backgroundColor: 'var(--status-green)', boxShadow: '0 0 0 4px var(--bg-primary), 0 0 14px var(--status-green)' }}
                />
                <div className="card-hover rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3">
                  <div className="font-medium text-[var(--text-primary)]">{m.label}</div>
                  <div className="mt-0.5 text-sm text-[var(--text-muted)]">{fmtFull(m.at)}</div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-4 text-sm text-[var(--text-muted)]">
            No deliveries yet — shipped milestones will appear here as features go live.
          </p>
        )}
      </Reveal>

      {/* Workstreams */}
      <Reveal className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Workstreams</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {phases.map((p, i) => {
            const color = statusColor(p.status)
            const active = p.status === 'In Progress'
            return (
              <article
                key={p.name}
                className={`card-hover relative rounded-2xl border bg-[var(--bg-surface)] p-5 ${active ? 'animate-float-glow' : ''}`}
                style={{ borderColor: active ? color : 'var(--bg-border)', animationDelay: `${i * 0.3}s` }}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)] sm:text-lg">{p.name}</h3>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: color + '22', color }}
                  >
                    {p.status}
                  </span>
                </div>
                {p.blurb && <p className="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">{p.blurb}</p>}
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-border)]">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.percent}%`, backgroundColor: color }} />
                </div>
                <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                  <span>{fmtRange(p.start, p.end)}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{p.percent}%</span>
                </div>

                {p.features.length > 0 && (() => {
                  const done = Math.round((p.percent / 100) * p.features.length)
                  return (
                    <details className="group mt-3 border-t border-[var(--bg-border)] pt-3">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-[var(--accent-teal)]">
                        <ChevronRight size={13} className="transition group-open:rotate-90" />
                        What&rsquo;s included ({done}/{p.features.length})
                      </summary>
                      <ul className="mt-3 space-y-2">
                        {p.features.map((f, fi) => {
                          const isDone = fi < done
                          const isActive = fi === done && p.status === 'In Progress'
                          return (
                            <li key={fi} className="flex items-center gap-2.5 text-sm">
                              {isDone ? (
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--status-green)' }}>
                                  <Check size={11} color="#000" />
                                </span>
                              ) : isActive ? (
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full pulse-dot" style={{ backgroundColor: 'var(--accent-teal)' }} />
                              ) : (
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full border" style={{ borderColor: 'var(--bg-border)' }} />
                              )}
                              <span className={isDone ? 'text-[var(--text-primary)]' : isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                                {f}
                              </span>
                              {isActive && (
                                <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--accent-teal)22', color: 'var(--accent-teal)' }}>
                                  In progress
                                </span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </details>
                  )
                })()}
              </article>
            )
          })}
        </div>
      </Reveal>

      {/* Programme timeline */}
      <Reveal className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Programme timeline</h2>
        <div className="overflow-x-auto rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-[150px] shrink-0 sm:w-[200px]">
                <div className="h-5" />
                {phases.map((p) => (
                  <div key={p.name} className="flex h-9 items-center truncate pr-3 text-xs text-[var(--text-primary)]" title={p.name}>
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
                {phases.map((p) => {
                  const color = statusColor(p.status)
                  return (
                    <div key={p.name} className="grid h-9 items-center" style={{ gridTemplateColumns: 'repeat(30, minmax(0,1fr))' }}>
                      <div
                        className="h-5 rounded-md transition-all"
                        style={{ gridColumnStart: p.startDay, gridColumnEnd: p.endDay + 1, background: `linear-gradient(90deg, ${color}, ${color}cc)`, opacity: 0.9 }}
                        title={`${fmtRange(p.start, p.end)} · ${p.status}`}
                      />
                    </div>
                  )
                })}
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
      </Reveal>

      <footer className="mt-8 border-t border-[var(--bg-border)] pt-6 text-center text-sm text-[var(--text-muted)]">
        Prepared by Iceberg AI Solutions
      </footer>
    </main>
  )
}

function Stat({
  icon, label, value, color, delay,
}: { icon: React.ReactNode; label: string; value: string; color: string; delay: number }) {
  return (
    <div className="card-hover animate-fade-up rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-1.5 text-xs" style={{ color }}>
        {icon}
        <span className="text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}
