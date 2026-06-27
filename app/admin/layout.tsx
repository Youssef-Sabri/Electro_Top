import { getServerSupabase } from '@/lib/supabase-server-cookies';
import AdminClientLayout from './AdminClientLayout';
import { OrdersProvider } from '@/context/OrdersContext';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const initialAuthState = user?.app_metadata?.role === 'admin';

  return (
    <OrdersProvider>
      <AdminClientLayout initialAuthState={initialAuthState}>{children}</AdminClientLayout>
    </OrdersProvider>
  );
}
