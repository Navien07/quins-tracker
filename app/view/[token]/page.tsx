import { getClientData } from '@/lib/client-data'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

function fmtRange(start: string, end: string): string {
  return `${fmtDay(start)} – ${fmtDay(end)}`
}

function statusColor(status: string): string {
  if (status === 'Delivered') return 'var(--status-green)'
  if (status === 'In Progress') return 'var(--accent-teal)'
  return 'var(--text-muted)'
}

function Ring({ percent }: { percent: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--bg-border)" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r} fill="none"
        stroke="var(--accent-teal)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="64" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-primary)" fontSize="26" fontWeight="600">
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Invalid or expired link</h1>
        <p className="text-[var(--text-muted)]">
          This link is not valid. Please contact your project lead for an up-to-date link.
        </p>
      </main>
    )
  }

  const { phases, milestones, overall } = data

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <header className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            MyKASIH Command Centre — Phase 2
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">Target go-live: 7 Jul 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <Ring percent={overall} />
          <div className="text-sm text-[var(--text-muted)]">
            <div className="font-medium text-[var(--text-primary)]">Overall progress</div>
            <div>across all workstreams</div>
          </div>
        </div>
      </header>

      {/* Phase cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        {phases.map((p) => (
          <article
            key={p.name}
            className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium leading-snug text-[var(--text-primary)]">{p.name}</h2>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: statusColor(p.status) + '22', color: statusColor(p.status) }}
              >
                {p.status}
              </span>
            </div>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-border)]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${p.percent}%`, backgroundColor: statusColor(p.status) }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>{fmtRange(p.start, p.end)}</span>
              <span>{p.percent}%</span>
            </div>
          </article>
        ))}
      </section>

      {/* Recently delivered */}
      {milestones.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-medium text-[var(--text-primary)]">Recently delivered</h2>
          <ul className="space-y-2">
            {milestones.map((m, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-3"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--status-green)' }} />
                <span className="text-[var(--text-primary)]">{m.label}</span>
                <span className="ml-auto text-sm text-[var(--text-muted)]">{fmtDay(m.at.slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-[var(--bg-border)] pt-6 text-center text-sm text-[var(--text-muted)]">
        Prepared by Iceberg AI Solutions
      </footer>
    </main>
  )
}
