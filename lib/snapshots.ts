import { admin } from '@/lib/supabase-admin'

/**
 * Upsert today's progress snapshot (one row per day) for the burndown chart.
 * Best-effort: if the progress_snapshots table hasn't been migrated yet,
 * this is a silent no-op so syncs never fail because of it.
 */
export async function recordSnapshot(): Promise<void> {
  try {
    const { data: phases } = await admin.from('phases').select('status,percent')
    if (!phases || phases.length === 0) return
    const overall = Math.round(phases.reduce((s, p) => s + p.percent, 0) / phases.length)
    const delivered = phases.filter((p) => p.status === 'delivered').length
    await admin.from('progress_snapshots').upsert({
      snap_date: new Date().toISOString().slice(0, 10),
      overall,
      delivered,
      total: phases.length,
    })
  } catch {
    // table missing or transient error — never block the caller
  }
}
