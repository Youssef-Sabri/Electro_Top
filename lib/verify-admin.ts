import { supabase } from '@/lib/supabase';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  return !error;
}
