import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/supabase-admin'
import { isClean } from '@/lib/translate'
import { sendWeeklyDigest } from '@/lib/notify'

export const runtime = 'nodejs'

/**
 * Friday digest: everything shipped in the last 7 days, emailed to the client.
 * Triggered by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [{ data: acts }, { data: phases }] = await Promise.all([
    admin
      .from('activity')
      .select('client_label,occurred_at')
      .eq('kind', 'tag')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false }),
    admin.from('phases').select('client_visible,percent'),
  ])

  // Brand wall: only translated labels, double-checked with isClean.
  const items = (acts ?? [])
    .filter((a) => a.client_label && isClean(a.client_label))
    .map((a) => ({ label: a.client_label as string, at: a.occurred_at as string }))

  if (items.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: 'nothing shipped this week' })
  }

  const visible = (phases ?? []).filter((p) => p.client_visible)
  const overall = visible.length
    ? Math.round(visible.reduce((s, p) => s + p.percent, 0) / visible.length)
    : 0

  const result = await sendWeeklyDigest(items, overall)
  return NextResponse.json({ ok: true, sent: result === 'sent', result, items: items.length })
}
