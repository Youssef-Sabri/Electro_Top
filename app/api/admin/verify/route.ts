import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'

export async function GET() {
  const supabaseClient = await getServerSupabase()

  const { data: { user }, error } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (error || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ verified: false }, { status: 401 })
  }

  return NextResponse.json({ verified: true })
}
