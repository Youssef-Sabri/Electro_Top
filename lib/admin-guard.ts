import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { requireAdmin } from '@/lib/api-auth'
import type { User } from '@supabase/supabase-js'

export async function requireAdminGuard(
  _request: Request
): Promise<{ supabaseClient: Awaited<ReturnType<typeof getServerSupabase>>; user: User } | NextResponse> {
  const supabaseClient = await getServerSupabase()

  const user = await requireAdmin(supabaseClient)
  if (user instanceof NextResponse) return user

  return { supabaseClient, user }
}
