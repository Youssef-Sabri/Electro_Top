import { getServerSupabase } from '@/lib/supabase-server-cookies';
import AdminClientLayout from './AdminClientLayout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  let initialAuthState = false;
  if (session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.role === 'admin') {
      initialAuthState = true;
    }
  }

  return <AdminClientLayout initialAuthState={initialAuthState}>{children}</AdminClientLayout>;
}
