import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import { verifyAdminPassword } from '@/lib/verify-admin-server'
import { clearStorageBucket } from '@/lib/file-utils'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { parseJsonBody } from '@/lib/parse-json'
import { devLog } from '@/lib/dev-log'

export async function DELETE(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  const body = await parseJsonBody<{ password?: string }>(request)
  if (body instanceof NextResponse) return body

  const password = body.password as string | undefined
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const email = authResult.email
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 })
  const pwError = await verifyAdminPassword(supabaseClient, email, password)
  if (pwError) return pwError

  // Delete all receipt files from storage before clearing DB records (including orphaned files)
  const clearClient = createSupabaseAdminClient()
  await clearStorageBucket(clearClient, STORAGE_BUCKETS.receipts)

  const { error: itemsError } = await supabaseClient.from(TABLES.orderItems).delete().neq('id', '')
  if (itemsError) {
    devLog('Clear order_items error:', itemsError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error: historyError } = await supabaseClient.from(TABLES.orderStatusHistory).delete().neq('id', '')
  if (historyError) {
    devLog('Clear order_status_history error:', historyError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error: ordersError } = await supabaseClient.from(TABLES.orders).delete().neq('id_unique_tracking', '')
  if (ordersError) {
    devLog('Clear orders error:', ordersError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
