import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeletons';

export const metadata: Metadata = {
  title: 'إدارة المخزون | إدارة إلكترو توب',
  description: 'إدارة وتحديث منتجات المخزون في كتالوج المتجر.',
};

const InventoryClient = dynamic(
  () => import('@/components/admin/InventoryClient').then((mod) => mod.InventoryClient),
  {
    loading: AdminTableSkeleton,
  }
);

export default function AdminInventoryPage() {
  return (
    <div className="w-full">
      <InventoryClient />
    </div>
  );
}
