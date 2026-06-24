import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'

export async function GET() {
  const supabaseClient = await getServerSupabase()

  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if (error || !user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ verified: false }, { status: 401 })
  }

  return NextResponse.json({ verified: true })
}
