import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { validateRequestOrigin } from '@/lib/csrf'

export async function DELETE(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()

  const supabaseClient = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      cookieStore.set(name, value, options as Partial<ResponseCookie>)
    },
    remove(name: string, options: Record<string, unknown>) {
      cookieStore.set(name, '', { ...options, maxAge: -1 } as Partial<ResponseCookie>)
    },
  })

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error: itemsError } = await supabaseClient.from('order_items').delete().neq('id', '')
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const { error: historyError } = await supabaseClient.from('order_status_history').delete().neq('id', '')
  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  const { error: ordersError } = await supabaseClient.from('orders').delete().neq('id_unique_tracking', '')
  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
