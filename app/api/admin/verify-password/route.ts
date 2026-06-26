import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import { verifyAdminPassword } from '@/lib/verify-admin-server'
import { parseJsonBody } from '@/lib/parse-json'

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

  const password = body.password as string | undefined
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const email = authResult.email
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 })
  const pwError = await verifyAdminPassword(supabaseClient, email, password)
  if (pwError) return pwError

  return NextResponse.json({ success: true })
}
