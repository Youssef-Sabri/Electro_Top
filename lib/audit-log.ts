import { supabase } from './supabase';

export async function logAdminAction(action: string, details?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action,
    details: details ?? null,
  });
}
