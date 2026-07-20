import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { clearStorageBucket } from '@/lib/utils/file'
import { TABLES, STORAGE_BUCKETS } from '@/lib/constants'
import { devLog } from '@/lib/utils/misc'
import { requirePasswordVerification } from '@/lib/api-helpers'

export async function DELETE(request: Request) {
  const result = await requirePasswordVerification(request)
  if (result instanceof NextResponse) return result
  const { supabaseClient } = result

  // Delete DB records first to maintain referential integrity, then clear storage
  const { error: ordersError } = await supabaseClient.from(TABLES.orders).delete().neq('id_unique_tracking', '')
  if (ordersError) {
    devLog('Clear orders error:', ordersError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // Only clear storage after DB deletion succeeds
  const clearClient = createSupabaseAdminClient()
  await clearStorageBucket(clearClient, STORAGE_BUCKETS.receipts)

  return NextResponse.json({ success: true })
}
