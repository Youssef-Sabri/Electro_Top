import type { Metadata } from 'next';
import { getServerSupabase } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/constants';
import AdminClientLayout from '@/app/admin/AdminClientLayout';
import { OrdersProvider } from '@/providers/OrdersContext';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const initialAuthState = isAdminRole(user?.app_metadata?.role);

  return (
    <OrdersProvider>
      <AdminClientLayout initialAuthState={initialAuthState}>{children}</AdminClientLayout>
    </OrdersProvider>
  );
}
