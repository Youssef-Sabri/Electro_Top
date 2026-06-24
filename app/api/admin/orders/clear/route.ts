import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'

export async function DELETE(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { password } = body
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  // Verify the password using signInWithPassword server-side
  const { error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (signInError) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 })
  }

  // Delete receipt files from storage before clearing DB records
  const adminClient = createSupabaseAdminClient()
  const { data: ordersWithScreenshots } = await adminClient.from('orders').select('instapay_screenshot')
  const receiptFiles = ordersWithScreenshots?.map(o => o.instapay_screenshot).filter(Boolean) || []
  if (receiptFiles.length > 0) {
    await adminClient.storage.from('instapay-receipts').remove(receiptFiles)
  }

  // Count orders for audit log
  const { data: ordersData } = await adminClient.from('orders').select('id_unique_tracking')
  const count = ordersData?.length || 0

  const { error: itemsError } = await supabaseClient.from('order_items').delete().neq('id', '')
  if (itemsError) {
    if (process.env.NODE_ENV !== 'production') console.error('Clear order_items error:', itemsError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error: historyError } = await supabaseClient.from('order_status_history').delete().neq('id', '')
  if (historyError) {
    if (process.env.NODE_ENV !== 'production') console.error('Clear order_status_history error:', historyError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { error: ordersError } = await supabaseClient.from('orders').delete().neq('id_unique_tracking', '')
  if (ordersError) {
    if (process.env.NODE_ENV !== 'production') console.error('Clear orders error:', ordersError);
    return NextResponse.json({ error: 'فشل مسح الطلبات. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // Server-Side Audit Log
  await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: 'clear_all_orders',
    details: { count }
  })

  return NextResponse.json({ success: true })
}
