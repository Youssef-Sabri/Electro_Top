import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'

export async function POST(request: Request) {
  const supabaseClient = await getServerSupabase()

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: string; details?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.action || typeof body.action !== 'string') {
    return NextResponse.json({ error: 'Action is required' }, { status: 400 })
  }

  const { error: insertError } = await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: body.action,
    details: body.details ?? null,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Audit log failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
