import { DAY_ONE, GO_LIVE, type Phase } from '@/lib/types'

const MS_PER_DAY = 86_400_000

function toUTC(iso: string): number {
  return new Date(iso + 'T00:00:00Z').getTime()
}

/** Whole days between two ISO dates (b - a). */
function daysBetween(aIso: string, bIso: string): number {
  return Math.round((toUTC(bIso) - toUTC(aIso)) / MS_PER_DAY)
}

/** Current day index on the 30-day plan (1-based). May be <1 or >30 outside the window. */
export function todayDayIndex(todayIso: string): number {
  return daysBetween(DAY_ONE, todayIso) + 1
}

/** Days remaining until go-live (negative if past). */
export function daysToGoLive(todayIso: string): number {
  return daysBetween(todayIso, GO_LIVE)
}

/** Expected completion % for a phase given today's date, assuming linear progress. */
export function expectedPercent(phase: Phase, todayIso: string): number {
  const today = todayDayIndex(todayIso)
  if (today <= phase.start_day) return 0
  if (today >= phase.end_day) return 100
  const span = phase.end_day - phase.start_day
  if (span <= 0) return 100
  return Math.round(((today - phase.start_day) / span) * 100)
}

export type Health = 'done' | 'on_track' | 'at_risk' | 'behind' | 'scheduled'

export interface HealthInfo {
  health: Health
  label: string
  color: string
}

/** Auto-derive schedule health by comparing actual % against expected %. */
export function phaseHealth(phase: Phase, todayIso: string): HealthInfo {
  if (phase.status === 'delivered' || phase.percent >= 100) {
    return { health: 'done', label: 'Delivered', color: 'var(--status-green)' }
  }
  const today = todayDayIndex(todayIso)
  if (today < phase.start_day) {
    return { health: 'scheduled', label: 'Scheduled', color: 'var(--text-muted)' }
  }
  const expected = expectedPercent(phase, todayIso)
  const gap = phase.percent - expected
  if (phase.status === 'blocked') {
    return { health: 'behind', label: 'Blocked', color: 'var(--status-red)' }
  }
  if (gap >= -5) return { health: 'on_track', label: 'On track', color: 'var(--status-green)' }
  if (gap >= -20) return { health: 'at_risk', label: 'At risk', color: 'var(--status-yellow)' }
  return { health: 'behind', label: 'Behind', color: 'var(--status-red)' }
}
