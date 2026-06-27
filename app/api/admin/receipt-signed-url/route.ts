import { NextRequest, NextResponse } from 'next/server'
import { requireAdminGuard } from '@/lib/admin-guard'
import { devLog } from '@/lib/dev-log'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { SAFE_FILENAME_RE } from '@/lib/validators'
import { normalizeTrackingId } from '@/lib/constants'

const SIGNED_URL_TTL = 300 // 5 minutes

export async function GET(request: NextRequest) {
  // 1. Verify admin session
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard

  const adminClient = createSupabaseAdminClient()


  // 2. Parse and validate query params
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') ?? ''
  const orderId = searchParams.get('orderId') ?? ''

  if (!filename || !SAFE_FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'Invalid or missing filename' }, { status: 400 })
  }

  // 3. Ownership check — verify the receipt belongs to the claimed order
  if (orderId) {
    const sanitizedOrderId = normalizeTrackingId(orderId)
    const { data: orderRow, error: fetchError } = await adminClient

      .from(TABLES.orders)
      .select('instapay_screenshot')
      .eq('id_unique_tracking', sanitizedOrderId)
      .maybeSingle()

    if (fetchError) {
      devLog('receipt-signed-url: ownership check failed:', fetchError.message)
      return NextResponse.json({ error: 'Failed to verify receipt ownership.' }, { status: 500 })
    }

    if (!orderRow) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // Normalise stored value — could be a bare filename or a full storage path
    const storedFilename = orderRow.instapay_screenshot?.split('/').pop() ?? ''
    if (storedFilename !== filename) {
      return NextResponse.json({ error: 'Receipt does not belong to this order.' }, { status: 403 })
    }
  }

  // 4. Generate signed URL server-side using the service-role key (never the anon key)
  const { data, error } = await adminClient.storage

    .from(STORAGE_BUCKETS.receipts)
    .createSignedUrl(filename, SIGNED_URL_TTL)

  if (error || !data?.signedUrl) {
    devLog('receipt-signed-url: createSignedUrl failed:', error?.message)
    return NextResponse.json({ error: 'Failed to generate signed URL.' }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
