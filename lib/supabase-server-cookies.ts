import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function getServerSupabase() {
  const cookieStore = await cookies()
  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      } catch {

      }
    },
  })
}
