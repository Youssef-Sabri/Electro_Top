import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getServerSupabase } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/constants';
import AdminClientLayout from '@/app/admin/AdminClientLayout';
import { OrdersProvider } from '@/providers/OrdersContext';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const initialAuthState = isAdminRole(user?.app_metadata?.role);

  return (
    <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center"><Spinner className="h-9 w-9 text-primary" /></div>}>
      <OrdersProvider>
        <AdminClientLayout initialAuthState={initialAuthState}>{children}</AdminClientLayout>
      </OrdersProvider>
    </Suspense>
  );
}
