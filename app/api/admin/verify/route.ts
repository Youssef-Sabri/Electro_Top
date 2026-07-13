import { NextResponse } from 'next/server'
import { requireAdminGuard } from '@/lib/auth'

export async function GET(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  return NextResponse.json({ verified: true })
}
