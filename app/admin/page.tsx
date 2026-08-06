import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AdminDashboardSkeleton } from '@/components/admin/AdminSkeletons';

export const metadata: Metadata = {
  title: 'لوحة التحكم | إدارة إلكترو توب',
  description: 'نظرة عامة على أداء المتجر وإحصائياته.',
};

const DashboardClient = dynamic(
  () => import('@/components/admin/DashboardClient').then((mod) => mod.DashboardClient),
  {
    loading: AdminDashboardSkeleton,
  }
);

export default function AdminPage() {
  return (
    <div className="w-full">
      <DashboardClient />
    </div>
  );
}
