import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'لوحة التحكم | إدارة إلكترو توب',
  description: 'نظرة عامة على أداء المتجر وإحصائياته.',
};

const DashboardClient = dynamic(
  () => import('@/components/admin/DashboardClient').then((mod) => mod.DashboardClient),
  {
    loading: () => (
      <div className="w-full py-20 text-center font-tajawal text-on-surface-variant">
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
