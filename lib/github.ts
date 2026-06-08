import { admin } from '@/lib/supabase-admin'

const REPO = process.env.GITHUB_REPO!
const TOKEN = process.env.GITHUB_TOKEN!
const H = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' }

export function tagToPhaseId(tag: string): string | null {
  const m: Record<string, string> = {
    'tracker-live': 'P2-00', 'p2-01-complete': 'P2-01', 'p2-02-complete': 'P2-02',
    'p2-02.5-complete': 'IL', 'p2-03-complete': 'P2-03', 'p2-04-complete': 'P2-04', 'v2.0.0': 'P2-05',
  }
  return m[tag] ?? null
}

/** Parse `feat(p2-01): ...` / `feat(il-03): ...` → phase id */
export function commitToPhaseId(message: string): string | null {
  const m = message.match(/\((p2-0\d(?:\.5)?|il-\d+)\)/i)
  if (!m) return null
  const k = m[1].toLowerCase()
  if (k.startsWith('il-')) return 'IL'
  return ({
    'p2-00': 'P2-00', 'p2-01': 'P2-01', 'p2-02': 'P2-02', 'p2-02.5': 'IL',
    'p2-03': 'P2-03', 'p2-04': 'P2-04', 'p2-05': 'P2-05',
  } as Record<string, string>)[k] ?? null
}

export async function fetchTags() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/tags?per_page=100`, { headers: H })
  if (!r.ok) throw new Error(`GitHub tags ${r.status}`)
  return r.json() as Promise<Array<{ name: string; commit: { sha: string } }>>
}

export async function fetchMergedPRs() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/pulls?state=closed&base=phase2&per_page=50`, { headers: H })
  if (!r.ok) throw new Error(`GitHub PRs ${r.status}`)
  const prs = await r.json() as Array<{ title: string; merged_at: string | null; html_url: string; merge_commit_sha: string }>
  return prs.filter(p => p.merged_at)
}

async function markDelivered(phaseId: string) {
  await admin.from('phases')
    .update({ status: 'delivered', percent: 100, updated_at: new Date().toISOString() })
    .eq('id', phaseId)
}

export interface ReconcileSummary {
  tagsSeen: number
  delivered: string[]
  prsSeen: number
  inProgress: string[]
}

/**
 * Full reconcile against GitHub: mark phases delivered from completion tags,
 * mark phases in-progress from merged PRs (unless already delivered).
 * Shared by the webhook `manual_resync` branch and the authenticated /resync route.
 */
export async function reconcile(): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { tagsSeen: 0, delivered: [], prsSeen: 0, inProgress: [] }

  const tags = await fetchTags()
  summary.tagsSeen = tags.length
  for (const t of tags) {
    const pid = tagToPhaseId(t.name)
    if (pid) {
      await markDelivered(pid)
      if (!summary.delivered.includes(pid)) summary.delivered.push(pid)
    }
  }

  const prs = await fetchMergedPRs()
  summary.prsSeen = prs.length
  for (const p of prs) {
    const pid = commitToPhaseId(p.title)
    if (!pid) continue
    await admin.from('phases').update({ status: 'in_progress' }).eq('id', pid).neq('status', 'delivered')
    if (!summary.inProgress.includes(pid)) summary.inProgress.push(pid)
  }

  return summary
}
