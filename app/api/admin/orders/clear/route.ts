import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import { verifyAdminPassword } from '@/lib/verify-admin-server'

export async function DELETE(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  const { password } = body
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const pwError = await verifyAdminPassword(supabaseClient, user.email!, password)
  if (pwError) return pwError

  // Delete all receipt files from storage before clearing DB records (including orphaned files)
  const adminClient = createSupabaseAdminClient()
  let allFiles: { name: string }[] = []
  let offset = 0
  const LIMIT = 100
  while (true) {
    const { data: files, error: listError } = await adminClient.storage
      .from('instapay-receipts')
      .list(undefined, { limit: LIMIT, offset })

    if (listError || !files || files.length === 0) break
    allFiles = allFiles.concat(files)
    if (files.length < LIMIT) break
    offset += LIMIT
  }

  if (allFiles.length > 0) {
    const fileNames = allFiles.map((f) => f.name)
    await adminClient.storage.from('instapay-receipts').remove(fileNames)
  }

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

  return NextResponse.json({ success: true })
}
