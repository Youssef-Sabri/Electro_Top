import { supabase } from './supabase';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!user?.email || !adminEmail || user.email !== adminEmail) return false;

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  return !error;
}
