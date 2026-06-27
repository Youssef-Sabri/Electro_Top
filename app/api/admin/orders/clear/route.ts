import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdminGuard } from '@/lib/admin-guard'
import { verifyAdminPassword } from '@/lib/verify-admin-server'
import { clearStorageBucket } from '@/lib/file-utils'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { parseJsonBody } from '@/lib/parse-json'
import { devLog } from '@/lib/dev-log'

export async function DELETE(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient, user } = guard

  const body = await parseJsonBody<{ password?: string }>(request)
  if (body instanceof NextResponse) return body

  const password = body.password as string | undefined
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const email = user.email
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 })
  const pwError = await verifyAdminPassword(supabaseClient, email, password)
  if (pwError) return pwError

  // Delete all receipt files from storage before clearing DB records (including orphaned files)
  const clearClient = createSupabaseAdminClient()
  await clearStorageBucket(clearClient, STORAGE_BUCKETS.receipts)

  const { error: ordersError } = await supabaseClient.from(TABLES.orders).delete().neq('id_unique_tracking', '')
  if (ordersError) {
    devLog('Clear orders error:', ordersError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
