import { getServerSupabase } from '@/lib/supabase-server-cookies';
import AdminClientLayout from './AdminClientLayout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const initialAuthState = user?.app_metadata?.role === 'admin';

  return <AdminClientLayout initialAuthState={initialAuthState}>{children}</AdminClientLayout>;
}
