import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import type { User } from '@supabase/supabase-js'

export async function requireAdminGuard(
  request: Request
): Promise<{ supabaseClient: Awaited<ReturnType<typeof getServerSupabase>>; user: User } | NextResponse> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (!validateRequestOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const supabaseClient = await getServerSupabase()

  const user = await requireAdmin(supabaseClient)
  if (user instanceof NextResponse) return user

  return { supabaseClient, user }
}
