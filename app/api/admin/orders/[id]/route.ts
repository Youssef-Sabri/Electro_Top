import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import { now } from '@/lib/date-utils'
import { TABLES, STORAGE_BUCKETS, VALID_ORDER_STATUSES, ADMIN_NOTES_MAX_LENGTH } from '@/lib/db-constants'
import { deleteStorageFile } from '@/lib/file-utils'
import { parseJsonBody } from '@/lib/parse-json'
import { devLog } from '@/lib/dev-log'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const uppercaseId = id.toUpperCase()

  const adminClient = createSupabaseAdminClient()

  const { data: rpcResult, error: rpcError } = await adminClient
    .rpc('get_order_detail_view', { order_id: uppercaseId })

  if (rpcError || !rpcResult || rpcResult.length === 0) {
    if (rpcError) devLog('Failed to fetch order details via RPC:', rpcError)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const result = rpcResult[0]
  return NextResponse.json({
    order: result.order_data?.[0] || null,
    items: result.items_data || [],
    history: result.history_data || [],
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const uppercaseId = id.toUpperCase()

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  // Fetch the order first to check for screenshot to delete
  const { data: orderData, error: fetchError } = await supabaseClient
    .from(TABLES.orders)
    .select('instapay_screenshot')
    .eq('id_unique_tracking', uppercaseId)
    .maybeSingle()

  if (fetchError) {
    devLog('Fetch order before delete error:', fetchError);
    return NextResponse.json({ error: 'فشل استرداد بيانات الطلب قبل الحذف.' }, { status: 500 })
  }

  const [{ error: itemsError }, { error: historyError }] = await Promise.all([
    supabaseClient.from(TABLES.orderItems).delete().eq('order_id', uppercaseId),
    supabaseClient    .from(TABLES.orderStatusHistory).delete().eq('order_id', uppercaseId),
  ])

  if (itemsError || historyError) {
    devLog('Delete order records error:', itemsError || historyError);
    return NextResponse.json({ error: 'فشل حذف سجلات الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error } = await supabaseClient
    .from(TABLES.orders)
    .delete()
    .eq('id_unique_tracking', uppercaseId)

  if (error) {
    devLog('Delete order error:', error);
    return NextResponse.json({ error: 'فشل حذف الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  if (orderData?.instapay_screenshot) {
    const adminClient = createSupabaseAdminClient()
    await deleteStorageFile(adminClient, STORAGE_BUCKETS.receipts, orderData.instapay_screenshot)
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const uppercaseId = id.toUpperCase()

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

  const updates: { status?: (typeof VALID_ORDER_STATUSES)[number]; admin_notes?: string } = {}

  if ('status' in body) {
    const status = body.status as (typeof VALID_ORDER_STATUSES)[number]
    if (!VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
    }
    updates.status = status
  }

  if ('admin_notes' in body) {
    const rawNotes = body.admin_notes
    if (typeof rawNotes !== 'string' || rawNotes.length > ADMIN_NOTES_MAX_LENGTH) {
      return NextResponse.json({ error: `Admin notes must be a string up to ${ADMIN_NOTES_MAX_LENGTH} characters` }, { status: 400 })
    }
    let notes: string = rawNotes
    // Strip HTML tags as a belt-and-suspenders measure.
    // IMPORTANT: admin notes must always be rendered via JSX text interpolation {notes},
    // never via dangerouslySetInnerHTML.
    notes = notes.replace(/<\/?[^>]+(>|$)/g, '')
    updates.admin_notes = notes
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Perform update
  const { error: updateError } = await supabaseClient
    .from(TABLES.orders)
    .update(updates)
    .eq('id_unique_tracking', uppercaseId)

  if (updateError) {
    devLog('Update order error:', updateError)
    return NextResponse.json({ error: 'فشل تحديث الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // If status was updated, insert into history table
  if ('status' in updates) {
    const historyId = `h-${uppercaseId}-${Date.now()}`
    const { error: historyError } = await supabaseClient
      .from(TABLES.orderStatusHistory)
      .insert({
        id: historyId,
        order_id: uppercaseId,
        status: updates.status,
        created_at: now()
      })

    if (historyError) {
      devLog('Insert order status history error:', historyError)
      return NextResponse.json({ error: 'فشل تحديث سجل حالة الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
