import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'إدارة المخزون | إدارة إلكترو توب',
  description: 'إدارة وتحديث منتجات المخزون في كتالوج المتجر.',
};

const InventoryClient = dynamic(
  () => import('../../../components/admin/InventoryClient').then((mod) => mod.InventoryClient),
  {
    loading: () => (
      <div className="w-full py-20 text-center font-poppins text-on-surface-variant">
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
