// lib/translate.ts — THE BRAND WALL. Client view renders NOTHING that hasn't passed through here.

export const FORBIDDEN_TERMS = [
  'claude', 'anthropic', 'claude code', 'ilmu', 'ytl', 'modal', 'hubert', 'wav2vec2',
  'xlm-roberta', 'phase 2a', 'phase 2b', 'p2-00', 'p2-01', 'p2-02', 'p2-03', 'p2-04',
  'p2-05', 'il-0', 'rm ', 'salary', 'p&l', 'openai', 'gpt',
] as const

/** Throw-on-leak guard. Use in tests/build check, not in render path. */
export function assertClean(text: string, context: string): void {
  const lower = text.toLowerCase()
  for (const term of FORBIDDEN_TERMS) {
    if (lower.includes(term)) {
      throw new Error(`BRAND LEAK in ${context}: forbidden term "${term}" in "${text}"`)
    }
  }
}

/** Returns true if a string is safe to show a client. */
export function isClean(text: string | null | undefined): boolean {
  if (!text) return true
  const lower = text.toLowerCase()
  return !FORBIDDEN_TERMS.some(t => lower.includes(t))
}

/** Map a git tag → a client-facing milestone label. Unknown tags return null (hidden). */
export function tagToClientMilestone(tag: string): string | null {
  const map: Record<string, string> = {
    'p2-01-complete': 'Emotional Intelligence Engine foundation delivered',
    'p2-02-complete': 'Dashboard analytics delivered',
    'p2-03-complete': 'Command Centre Dashboard V2 delivered',
    'p2-04-complete': 'Voice & WhatsApp Assistant V2 delivered',
    'v2.0.0':         'System go-live',
  }
  return map[tag] ?? null   // p2-00, p2-02.5, internal tags → null (never shown)
}

/** Client-safe status label. */
export function clientStatus(status: string): string {
  switch (status) {
    case 'delivered':   return 'Delivered'
    case 'in_progress': return 'In Progress'
    case 'blocked':     return 'On Track'   // never expose "blocked" to client
    default:            return 'Scheduled'
  }
}

/**
 * Short, client-safe descriptions per workstream, keyed by client_name.
 * Authored to contain NO internal/vendor terms. Still passed through isClean()
 * before render as a final guard.
 */
const CLIENT_BLURBS: Record<string, string> = {
  'Emotional Intelligence Engine — Foundation':
    'The core engine that reads sentiment and emotional tone across customer conversations — the foundation for smarter, more empathetic support.',
  'Dashboard Analytics & Sentiment':
    'Live analytics and sentiment breakdowns so the team can see customer mood and trends at a glance.',
  'Command Centre Dashboard V2':
    'A redesigned operations dashboard that brings cases, live metrics and alerts into one streamlined command centre.',
  'Voice & WhatsApp Assistant V2':
    'An upgraded voice and WhatsApp assistant for faster, more natural automated customer conversations.',
  'Testing & Go-Live':
    'End-to-end testing, user acceptance and the controlled production launch of the new system.',
  'Model Calibration & Quality Assurance':
    'Continuous tuning and quality checks that keep the AI accurate, fair and dependable.',
  'Advanced Voice Emotion Model':
    'A next-generation model that understands emotion directly from a caller’s voice.',
}

/** Brand-safe one-line description for a client-visible workstream (or null). */
export function phaseBlurb(clientName: string): string | null {
  const b = CLIENT_BLURBS[clientName]
  return b && isClean(b) ? b : null
}

/** Shape returned to the client view — derived ONLY from safe columns. */
export interface ClientPhaseView {
  name: string          // client_name
  blurb: string | null  // brand-safe description
  status: string        // clientStatus()
  percent: number
  start: string         // start_date
  end: string           // end_date
  startDay: number      // 1..30
  endDay: number        // 1..30
}

type PhaseRow = {
  client_name: string | null
  client_visible: boolean
  status: string
  percent: number
  start_date: string
  end_date: string
  start_day: number
  end_day: number
}

export function toClientPhases(rows: PhaseRow[]): ClientPhaseView[] {
  return rows
    .filter(r => r.client_visible && r.client_name && isClean(r.client_name))
    .map(r => ({
      name: r.client_name as string,
      blurb: phaseBlurb(r.client_name as string),
      status: clientStatus(r.status),
      percent: r.percent,
      start: r.start_date,
      end: r.end_date,
      startDay: r.start_day,
      endDay: r.end_day,
    }))
}
