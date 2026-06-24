import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import { now } from '@/lib/date-utils'

const VALID_ORDER_STATUSES = [
  'Pending Review', 'Accepted', 'Processing', 'Delivered', 'Declined', 'Check Internal Note',
] as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const uppercaseId = id.toUpperCase()

  const adminClient = createSupabaseAdminClient()

  const { data: rpcResult, error: rpcError } = await adminClient
    .rpc('get_order_detail_view', { order_id: uppercaseId })

  if (rpcError || !rpcResult || rpcResult.length === 0) {
    if (process.env.NODE_ENV !== 'production' && rpcError) {
      console.error('Failed to fetch order details via RPC:', rpcError)
    }
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

  const [{ error: itemsError }, { error: historyError }] = await Promise.all([
    supabaseClient.from('order_items').delete().eq('order_id', uppercaseId),
    supabaseClient.from('order_status_history').delete().eq('order_id', uppercaseId),
  ])

  if (itemsError || historyError) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete order records error:', itemsError || historyError);
    return NextResponse.json({ error: 'فشل حذف سجلات الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error } = await supabaseClient
    .from('orders')
    .delete()
    .eq('id_unique_tracking', uppercaseId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete order error:', error);
    return NextResponse.json({ error: 'فشل حذف الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
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

  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: { status?: (typeof VALID_ORDER_STATUSES)[number]; admin_notes?: string } = {}

  if ('status' in body) {
    const status = body.status
    if (!VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
    }
    updates.status = status
  }

  if ('admin_notes' in body) {
    const notes = body.admin_notes
    if (typeof notes !== 'string' || notes.length > 2000) {
      return NextResponse.json({ error: 'Admin notes must be a string up to 2000 characters' }, { status: 400 })
    }
    updates.admin_notes = notes
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Perform update
  const { error: updateError } = await supabaseClient
    .from('orders')
    .update(updates)
    .eq('id_unique_tracking', uppercaseId)

  if (updateError) {
    if (process.env.NODE_ENV !== 'production') console.error('Update order error:', updateError)
    return NextResponse.json({ error: 'فشل تحديث الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // If status was updated, insert into history table
  if ('status' in updates) {
    const historyId = `h-${uppercaseId}-${Date.now()}`
    const { error: historyError } = await supabaseClient
      .from('order_status_history')
      .insert({
        id: historyId,
        order_id: uppercaseId,
        status: updates.status,
        timestamp: now()
      })

    if (historyError) {
      if (process.env.NODE_ENV !== 'production') console.error('Insert order status history error:', historyError)
      // We don't block status update if history insert fails, but log it
    }
  }

  return NextResponse.json({ success: true })
}
