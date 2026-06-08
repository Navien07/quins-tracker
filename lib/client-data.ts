import { admin } from '@/lib/supabase-admin'
import { toClientPhases, tagToClientMilestone, isClean, type ClientPhaseView } from '@/lib/translate'

export interface ClientMilestone {
  label: string
  at: string
}

export interface ClientData {
  phases: ClientPhaseView[]
  milestones: ClientMilestone[]
  overall: number
}

/** Validate the share token and return ONLY translated, brand-safe data. */
export async function getClientData(token: string | null): Promise<ClientData | null> {
  if (!token || token !== process.env.CLIENT_SHARE_TOKEN) return null

  const { data: phases } = await admin
    .from('phases')
    .select('client_name,client_visible,status,percent,start_date,end_date,sort_order')
    .order('sort_order')

  const { data: acts } = await admin
    .from('activity')
    .select('client_label,occurred_at')
    .eq('kind', 'tag')
    .order('occurred_at', { ascending: false })

  // Double-guard: tagToClientMilestone already gates labels, isClean is the final wall.
  const milestones: ClientMilestone[] = (acts ?? [])
    .filter(a => a.client_label && isClean(a.client_label))
    .map(a => ({ label: a.client_label as string, at: a.occurred_at as string }))

  const cp = toClientPhases(phases ?? [])
  const overall = cp.length ? Math.round(cp.reduce((s, p) => s + p.percent, 0) / cp.length) : 0

  return { phases: cp, milestones, overall }
}

// Re-export so callers can map tags without reaching past the brand wall.
export { tagToClientMilestone }
