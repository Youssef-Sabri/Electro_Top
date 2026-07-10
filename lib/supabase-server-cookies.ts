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
      } catch (error) {
        // The `setAll` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing user sessions.
      }
    },
  })
}
