import { headers } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import type { Phase, Task, Blocker, Activity } from '@/lib/types'
import Board from './Board'

export const dynamic = 'force-dynamic'

export default async function InternalPage() {
  const supabase = await createSupabaseServer()

  const [{ data: phases }, { data: tasks }, { data: blockers }, { data: activity }, { data: sync }] =
    await Promise.all([
      supabase.from('phases').select('*').order('sort_order'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('blockers').select('*').order('created_at'),
      supabase.from('activity').select('*').order('occurred_at', { ascending: false }).limit(40),
      supabase.from('sync_log').select('synced_at,source').order('synced_at', { ascending: false }).limit(1),
    ])

  const token = process.env.CLIENT_SHARE_TOKEN ?? ''
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const shareUrl = `${proto}://${host}/view/${token}`

  const lastSync = (sync?.[0] as { synced_at: string; source: string } | undefined) ?? null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Board
      phases={(phases ?? []) as Phase[]}
      tasks={(tasks ?? []) as Task[]}
      blockers={(blockers ?? []) as Blocker[]}
      activity={(activity ?? []) as Activity[]}
      lastSync={lastSync}
      shareUrl={shareUrl}
      today={today}
    />
  )
}
