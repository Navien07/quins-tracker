export type PhaseStatus = 'not_started' | 'in_progress' | 'delivered' | 'blocked'

export interface Phase {
  id: string
  internal_name: string
  client_name: string | null
  client_visible: boolean
  track: string
  start_day: number
  end_day: number
  start_date: string
  end_date: string
  ship_tag: string | null
  status: PhaseStatus
  percent: number
  owner: string | null
  sort_order: number
  preview_url: string | null
}

export interface Task {
  id: string
  phase_id: string
  title: string
  owner: string | null
  done: boolean
  created_at: string
}

export interface Blocker {
  id: string
  label: string
  owner: string
  needed_by: string | null
  status: 'open' | 'resolved'
}

export interface Activity {
  id: string
  phase_id: string | null
  kind: string
  raw_message: string
  url: string | null
  occurred_at: string
}

export const TRACKS: { key: string; label: string }[] = [
  { key: 'core', label: 'Core Track' },
  { key: 'parallel_a', label: 'Parallel A' },
  { key: 'parallel_b', label: 'Parallel B' },
  { key: 'parallel_c', label: 'Parallel C' },
]

export const GO_LIVE = '2026-07-07'
export const DAY_ONE = '2026-06-08'

export interface ProgressSnapshot {
  snap_date: string
  overall: number
  delivered: number
  total: number
}
