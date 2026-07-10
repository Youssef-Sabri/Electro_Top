import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function verifyAdminPassword(
  _supabaseClient: SupabaseClient,
  email: string,
  password: string
): Promise<NextResponse | void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase configuration environment variables are missing.' }, { status: 500 })
  }

  // Create a completely stateless client that does not persist session or modify browser cookies
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 })
  }
}
