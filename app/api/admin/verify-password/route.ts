import { NextResponse } from 'next/server'
import { requirePasswordVerification } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const result = await requirePasswordVerification(request)
  if (result instanceof NextResponse) return result

  return NextResponse.json({ success: true })
}
