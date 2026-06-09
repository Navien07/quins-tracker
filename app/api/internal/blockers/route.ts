import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { admin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { label, owner, needed_by } = await req.json()
  if (!label?.trim() || !owner?.trim()) {
    return NextResponse.json({ error: 'label and owner required' }, { status: 400 })
  }
  const { data, error } = await admin
    .from('blockers')
    .insert({ label: label.trim(), owner: owner.trim(), needed_by: needed_by?.trim() || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, blocker: data })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { id, status } = await req.json()
  if (!id || (status !== 'open' && status !== 'resolved')) {
    return NextResponse.json({ error: 'id and valid status required' }, { status: 400 })
  }
  const { error } = await admin.from('blockers').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await admin.from('blockers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
