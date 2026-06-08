import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { admin } from '@/lib/supabase-admin'
import { tagToPhaseId, commitToPhaseId, reconcile } from '@/lib/github'
import { tagToClientMilestone } from '@/lib/translate'

export const runtime = 'nodejs'

function verify(raw: string, sig: string | null): boolean {
  if (!sig) return false
  const h = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!).update(raw).digest('hex')
  const a = Buffer.from(h)
  const b = Buffer.from(sig)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function markDelivered(phaseId: string) {
  await admin.from('phases')
    .update({ status: 'delivered', percent: 100, updated_at: new Date().toISOString() })
    .eq('id', phaseId)
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!verify(raw, req.headers.get('x-tracker-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(raw || '{}')

  if (body.event === 'tag' && body.tag) {
    const pid = tagToPhaseId(body.tag)
    if (pid) {
      await markDelivered(pid)
      await admin.from('activity').insert({
        phase_id: pid, kind: 'tag', raw_message: `tag ${body.tag}`,
        client_label: tagToClientMilestone(body.tag), sha: body.sha, url: body.url,
        occurred_at: new Date().toISOString(),
      })
    }
  } else if (body.event === 'pr_merged' && body.pr_title) {
    const pid = commitToPhaseId(body.pr_title)
    if (pid) {
      // mark in-progress if not yet delivered
      await admin.from('phases').update({ status: 'in_progress' }).eq('id', pid).neq('status', 'delivered')
      await admin.from('activity').insert({
        phase_id: pid, kind: 'pr_merged', raw_message: body.pr_title,
        client_label: null, sha: body.sha, url: body.url, occurred_at: new Date().toISOString(),
      })
    }
  } else if (body.event === 'manual_resync') {
    await reconcile()
  } else {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  await admin.from('sync_log').insert({
    source: body.event === 'manual_resync' ? 'manual_resync' : 'webhook',
    detail: JSON.stringify(body).slice(0, 300),
  })
  return NextResponse.json({ ok: true })
}
