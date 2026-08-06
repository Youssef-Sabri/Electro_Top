import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeletons';

export const metadata: Metadata = {
  title: 'دفتر الطلبات | إدارة إلكترو توب',
  description: 'إدارة ومراجعة جميع طلبات المتجر.',
};

const OrdersLedger = dynamic(
  () => import('@/components/admin/OrdersLedger').then((mod) => mod.OrdersLedger),
  {
    loading: AdminTableSkeleton,
  }
);

export default function AdminOrdersPage() {
  return (
    <div className="w-full">
      <OrdersLedger />
    </div>
  );
}
