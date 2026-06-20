import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET() {
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

  const { data: { user }, error } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (error || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ verified: false }, { status: 401 })
  }

  return NextResponse.json({ verified: true })
}
