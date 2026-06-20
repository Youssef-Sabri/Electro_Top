import { supabase } from '@/lib/supabase';

export async function logAdminAction(action: string, details?: Record<string, unknown>) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error(userError?.message || 'Cannot log admin action: no authenticated user');
  }

  const { error: insertError } = await supabase.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action,
    details: details ?? null,
  });

  if (insertError) {
    throw new Error(`Audit log failed: ${insertError.message}`);
  }
}
