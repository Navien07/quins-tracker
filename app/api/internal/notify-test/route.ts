import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { notifyClient } from '@/lib/notify'

export const runtime = 'nodejs'

export async function POST() {
  if (!(await requireUser())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const result = await notifyClient('Test notification — your delivery alerts are working')
  return NextResponse.json({ ok: true, result })
}
