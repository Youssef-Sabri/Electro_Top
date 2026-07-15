import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'إدارة المخزون | إدارة إلكترو توب',
  description: 'إدارة وتحديث منتجات المخزون في كتالوج المتجر.',
};

const InventoryClient = dynamic(
  () => import('@/components/admin/InventoryClient').then((mod) => mod.InventoryClient),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل إدارة المخزون...</p>
      </div>
    ),
  }
);

export default function AdminInventoryPage() {
  return (
    <div className="w-full">
      <InventoryClient />
    </div>
  );
}
