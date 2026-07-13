import { NextResponse } from 'next/server';
import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/constants';

export async function requireAdmin(supabaseClient: SupabaseClient) {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user || !isAdminRole(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

export async function requireAdminGuard(
  _request: Request
): Promise<{ supabaseClient: Awaited<ReturnType<typeof getServerSupabase>>; user: User } | NextResponse> {
  const supabaseClient = await getServerSupabase();

  const user = await requireAdmin(supabaseClient);
  if (user instanceof NextResponse) return user;

  return { supabaseClient, user };
}

export async function verifyAdminPassword(
  _supabaseClient: SupabaseClient,
  email: string,
  password: string
): Promise<NextResponse | void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase configuration environment variables are missing.' }, { status: 500 });
  }

  // Create a completely stateless client that does not persist session or modify browser cookies
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 });
  }
}
