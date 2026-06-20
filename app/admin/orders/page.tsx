import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'دفتر الطلبات | إدارة إلكترو توب',
  description: 'إدارة ومراجعة جميع طلبات المتجر.',
};

const OrdersLedger = dynamic(
  () => import('../../../components/admin/OrdersLedger').then((mod) => mod.OrdersLedger),
  {
    loading: () => (
      <div className="w-full py-20 text-center font-poppins text-on-surface-variant">
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
