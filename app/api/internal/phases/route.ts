import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { admin } from '@/lib/supabase-admin'
import type { PhaseStatus } from '@/lib/types'

export const runtime = 'nodejs'

const STATUSES: PhaseStatus[] = ['not_started', 'in_progress', 'delivered', 'blocked']

export async function PATCH(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id, status, owner, percent } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }
    patch.status = status
    if (status === 'delivered') patch.percent = 100
  }
  if (owner !== undefined) patch.owner = owner || null
  if (percent !== undefined) {
    const p = Number(percent)
    if (Number.isNaN(p) || p < 0 || p > 100) {
      return NextResponse.json({ error: 'percent must be 0-100' }, { status: 400 })
    }
    patch.percent = Math.round(p)
  }

  const { error } = await admin.from('phases').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
