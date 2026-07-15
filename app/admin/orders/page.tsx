import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'دفتر الطلبات | إدارة إلكترو توب',
  description: 'إدارة ومراجعة جميع طلبات المتجر.',
};

const OrdersLedger = dynamic(
  () => import('@/components/admin/OrdersLedger').then((mod) => mod.OrdersLedger),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل دفتر الطلبات...</p>
      </div>
    ),
  }
);

export default function AdminOrdersPage() {
  return (
    <div className="w-full">
      <OrdersLedger />
    </div>
  );
}
