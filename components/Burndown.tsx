'use client'

import type { ProgressSnapshot } from '@/lib/types'
import { todayDayIndex } from '@/lib/health'

const W = 720
const H = 220
const PAD = { l: 36, r: 12, t: 14, b: 24 }

function x(day: number): number {
  return PAD.l + ((day - 1) / 29) * (W - PAD.l - PAD.r)
}
function y(pct: number): number {
  return H - PAD.b - (pct / 100) * (H - PAD.t - PAD.b)
}

/** Progress-over-time: ideal pace line vs actual recorded snapshots. */
export default function Burndown({ snapshots, today }: { snapshots: ProgressSnapshot[]; today: string }) {
  const pts = snapshots
    .map((s) => ({ day: todayDayIndex(s.snap_date), pct: s.overall }))
    .filter((p) => p.day >= 1 && p.day <= 30)
    .sort((a, b) => a.day - b.day)

  const actualPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day)},${y(p.pct)}`).join(' ')
  const last = pts.at(-1)
  const todayIdx = todayDayIndex(today)
  const showToday = todayIdx >= 1 && todayIdx <= 30

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full" role="img" aria-label="Progress over time vs ideal pace">
        {/* gridlines */}
        {[0, 25, 50, 75, 100].map((p) => (
          <g key={p}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(p)} y2={y(p)} stroke="var(--bg-border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(p) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{p}%</text>
          </g>
        ))}
        {[1, 5, 10, 15, 20, 25, 30].map((d) => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)">D{d}</text>
        ))}

        {/* ideal pace */}
        <line x1={x(1)} y1={y(0)} x2={x(30)} y2={y(100)} stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />

        {/* today marker */}
        {showToday && (
          <line x1={x(todayIdx)} x2={x(todayIdx)} y1={PAD.t} y2={H - PAD.b} stroke="var(--status-yellow)" strokeWidth="1" opacity="0.8" />
        )}

        {/* actual */}
        {pts.length > 0 && (
          <>
            <path d={actualPath} fill="none" stroke="var(--accent-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p) => (
              <circle key={p.day} cx={x(p.day)} cy={y(p.pct)} r="3.5" fill="var(--accent-teal)" />
            ))}
            {last && (
              <text x={Math.min(x(last.day) + 8, W - PAD.r - 24)} y={y(last.pct) - 6} fontSize="10" fontWeight="700" fill="var(--accent-teal)">
                {last.pct}%
              </text>
            )}
          </>
        )}

        {pts.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
            No snapshots yet — run the migration, then each sync records one per day.
          </text>
        )}
      </svg>
      <div className="mt-1 flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: 'var(--accent-teal)' }} /> Actual</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 rounded border-t border-dashed" style={{ borderColor: 'var(--text-muted)' }} /> Ideal pace</span>
      </div>
    </div>
  )
}
