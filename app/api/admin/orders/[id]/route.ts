import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const supabaseClient = await getServerSupabase()

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  return NextResponse.json({ success: true })
}
