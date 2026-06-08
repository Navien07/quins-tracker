import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { admin } from '@/lib/supabase-admin'
import { reconcile } from '@/lib/github'

export const runtime = 'nodejs'

export async function POST() {
  // Gate: only an authenticated internal user may trigger a resync.
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let summary
  try {
    summary = await reconcile()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'reconcile failed' },
      { status: 502 }
    )
  }

  await admin.from('sync_log').insert({
    source: 'manual_resync',
    detail: `by ${user.email ?? user.id}: ${JSON.stringify(summary).slice(0, 250)}`,
  })

  return NextResponse.json({ ok: true, summary })
}
