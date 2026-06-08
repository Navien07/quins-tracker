import { NextRequest, NextResponse } from 'next/server'
import { getClientData } from '@/lib/client-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const data = await getClientData(token)
  if (!data) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json(data)
}
