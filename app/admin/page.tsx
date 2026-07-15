import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'لوحة التحكم | إدارة إلكترو توب',
  description: 'نظرة عامة على أداء المتجر وإحصائياته.',
};

const DashboardClient = dynamic(
  () => import('@/components/admin/DashboardClient').then((mod) => mod.DashboardClient),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل إحصاءات لوحة التحكم...</p>
      </div>
    ),
  }
);

export default function AdminPage() {
  return (
    <div className="w-full">
      <DashboardClient />
    </div>
  );
}
