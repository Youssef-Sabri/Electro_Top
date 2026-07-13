import { NextResponse } from 'next/server'
import { requireAdminGuard } from '@/lib/auth'
import { verifyAdminPassword } from '@/lib/auth'
import { parseJsonBody } from '@/lib/utils/misc'

export async function POST(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient, user } = guard

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

  const password = body.password as string | undefined
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const email = user.email
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 })
  const pwError = await verifyAdminPassword(supabaseClient, email, password)
  if (pwError) return pwError

  return NextResponse.json({ success: true })
}
