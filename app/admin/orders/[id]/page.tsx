import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AdminOrderDetailSkeleton } from '@/components/admin/AdminSkeletons';

export const metadata: Metadata = {
  title: 'إدارة الطلب | لوحة تحكم إلكترو توب',
  description: 'تفاصيل الطلب وإدارة حالته.',
};

const OrderDetailClient = dynamic(
  () => import('@/components/admin/OrderDetailClient').then((mod) => mod.OrderDetailClient),
  {
    loading: AdminOrderDetailSkeleton,
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
