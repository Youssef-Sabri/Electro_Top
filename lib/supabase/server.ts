import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type CookieMethods = {
  getAll(): { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]): void | Promise<void>;
};

export function createSupabaseServerClient(cookieMethods: CookieMethods) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieMethods.getAll();
        },
        setAll(cookiesToSet) {
          return cookieMethods.setAll(cookiesToSet);
        },
      },
    }
  );
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  if (!secretKey) throw new Error('Missing environment variable: SUPABASE_SECRET_KEY');

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Safe to ignore in Server Components where cookies cannot be set
      }
    },
  });
}
