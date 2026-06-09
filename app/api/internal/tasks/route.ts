import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { admin } from '@/lib/supabase-admin'
import { recomputePhasePercent } from '@/lib/phase-progress'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { phase_id, title, owner } = await req.json()
  if (!phase_id || !title?.trim()) {
    return NextResponse.json({ error: 'phase_id and title required' }, { status: 400 })
  }
  const { data, error } = await admin
    .from('tasks')
    .insert({ phase_id, title: title.trim(), owner: owner ?? null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await recomputePhasePercent(phase_id)
  return NextResponse.json({ ok: true, task: data })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id, done } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await admin
    .from('tasks')
    .update({ done: !!done })
    .eq('id', id)
    .select('phase_id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data?.phase_id) await recomputePhasePercent(data.phase_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await admin
    .from('tasks')
    .delete()
    .eq('id', id)
    .select('phase_id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data?.phase_id) await recomputePhasePercent(data.phase_id)
  return NextResponse.json({ ok: true })
}
