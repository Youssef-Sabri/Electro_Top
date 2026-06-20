import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'إدارة الطلب | لوحة تحكم إلكترو توب',
  description: 'تفاصيل الطلب وإدارة حالته.',
};

const OrderDetailClient = dynamic(
  () => import('../../../../components/admin/OrderDetailClient').then((mod) => mod.OrderDetailClient),
  {
    loading: () => (
      <div className="w-full py-20 text-center font-poppins text-on-surface-variant">
        <p className="text-sm">جاري تحميل تفاصيل الطلب...</p>
      </div>
    ),
  }
);

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="w-full">
      <OrderDetailClient id={id} />
    </div>
  );
}
