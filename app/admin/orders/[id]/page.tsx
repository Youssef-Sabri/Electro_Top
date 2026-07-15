import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'إدارة الطلب | لوحة تحكم إلكترو توب',
  description: 'تفاصيل الطلب وإدارة حالته.',
};

const OrderDetailClient = dynamic(
  () => import('@/components/admin/OrderDetailClient').then((mod) => mod.OrderDetailClient),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
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
