import { supabase } from '@/lib/supabase';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!user?.email || !sessionData.session) return false;

  const { error } = await supabase.auth.reauthenticate();

  if (error) return false;

  return true;
}
