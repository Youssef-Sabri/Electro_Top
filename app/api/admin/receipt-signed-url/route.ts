import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'

const SAFE_FILENAME_RE = /^receipt-[a-z0-9]+\.(jpg|jpeg|png|webp|heic|heif|gif)$/i
const SIGNED_URL_TTL = 300 // 5 minutes

export async function GET(request: NextRequest) {
  // 1. Verify admin session
  const supabase = await getServerSupabase()
  const authResult = await requireAdmin(supabase)
  if (authResult instanceof NextResponse) return authResult

  // 2. Parse and validate query params
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') ?? ''
  const orderId = searchParams.get('orderId') ?? ''

  if (!filename || !SAFE_FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'Invalid or missing filename' }, { status: 400 })
  }

  // 3. Ownership check — verify the receipt belongs to the claimed order
  if (orderId) {
    const upperOrderId = orderId.toUpperCase()
    const adminClient = createSupabaseAdminClient()
    const { data: orderRow, error: fetchError } = await adminClient
      .from(TABLES.orders)
      .select('instapay_screenshot')
      .eq('id_unique_tracking', upperOrderId)
      .maybeSingle()

    if (fetchError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('receipt-signed-url: ownership check failed:', fetchError.message)
      }
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
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient.storage
    .from(STORAGE_BUCKETS.receipts)
    .createSignedUrl(filename, SIGNED_URL_TTL)

  if (error || !data?.signedUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('receipt-signed-url: createSignedUrl failed:', error?.message)
    }
    return NextResponse.json({ error: 'Failed to generate signed URL.' }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
