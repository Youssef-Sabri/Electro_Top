import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'

const VALID_ORDER_STATUSES = [
  'Pending Review', 'Accepted', 'Processing', 'Delivered', 'Declined', 'Check Internal Note',
] as const

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const supabaseClient = await getServerSupabase()

  const adminOrError = await requireAdmin(supabaseClient)
  if (adminOrError instanceof NextResponse) return adminOrError
  const user = adminOrError

  // GET the order to get the customer name for the audit log
  const { data: orderData } = await supabaseClient
    .from('orders')
    .select('customer_name')
    .eq('id_unique_tracking', id)
    .single()

  const customerName = orderData?.customer_name || 'Unknown'

  const [{ error: itemsError }, { error: historyError }] = await Promise.all([
    supabaseClient.from('order_items').delete().eq('order_id', id),
    supabaseClient.from('order_status_history').delete().eq('order_id', id),
  ])

  if (itemsError || historyError) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete order records error:', itemsError || historyError);
    return NextResponse.json({ error: 'فشل حذف سجلات الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error } = await supabaseClient
    .from('orders')
    .delete()
    .eq('id_unique_tracking', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete order error:', error);
    return NextResponse.json({ error: 'فشل حذف الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // Server-Side Audit Log
  await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: 'delete_order',
    details: { order_id: id, customer: customerName }
  })

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

  const supabaseClient = await getServerSupabase()

  const adminOrError = await requireAdmin(supabaseClient)
  if (adminOrError instanceof NextResponse) return adminOrError
  const user = adminOrError

  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: { status?: (typeof VALID_ORDER_STATUSES)[number]; admin_notes?: string } = {}
  const auditLogs = []

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
    .eq('id_unique_tracking', id)

  if (updateError) {
    if (process.env.NODE_ENV !== 'production') console.error('Update order error:', updateError)
    return NextResponse.json({ error: 'فشل تحديث الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // If status was updated, insert into history table
  if ('status' in updates) {
    const historyId = `h-${id}-${Date.now()}`
    const { error: historyError } = await supabaseClient
      .from('order_status_history')
      .insert({
        id: historyId,
        order_id: id,
        status: updates.status,
        timestamp: new Date().toISOString()
      })

    if (historyError) {
      if (process.env.NODE_ENV !== 'production') console.error('Insert order status history error:', historyError)
      // We don't block status update if history insert fails, but log it
    }

    auditLogs.push({
      admin_id: user.id,
      admin_email: user.email,
      action: 'update_order_status',
      details: { order_id: id, new_status: updates.status }
    })
  }

  if (updates.admin_notes !== undefined) {
    auditLogs.push({
      admin_id: user.id,
      admin_email: user.email,
      action: 'update_admin_notes',
      details: { order_id: id, notes_length: updates.admin_notes.length }
    })
  }

  // Insert audit logs
  if (auditLogs.length > 0) {
    await supabaseClient.from('admin_audit_log').insert(auditLogs)
  }

  return NextResponse.json({ success: true })
}
