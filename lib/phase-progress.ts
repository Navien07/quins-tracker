import { admin } from '@/lib/supabase-admin'

/**
 * Recompute a phase's percent from its tasks (done / total).
 * - Tag-driven "delivered" phases are left untouched (tags are authoritative).
 * - A phase with no tasks is left untouched (percent is managed manually / by sync).
 * - Otherwise percent = round(done/total*100); status nudges not_started → in_progress.
 */
export async function recomputePhasePercent(phaseId: string): Promise<void> {
  const { data: phase } = await admin
    .from('phases')
    .select('status')
    .eq('id', phaseId)
    .single()

  if (!phase || phase.status === 'delivered') return

  const { data: tasks } = await admin.from('tasks').select('done').eq('phase_id', phaseId)
  if (!tasks || tasks.length === 0) return

  const done = tasks.filter((t) => t.done).length
  const percent = Math.round((done / tasks.length) * 100)

  const nextStatus =
    phase.status === 'blocked'
      ? 'blocked'
      : percent > 0
        ? 'in_progress'
        : 'not_started'

  await admin
    .from('phases')
    .update({ percent, status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', phaseId)
}
