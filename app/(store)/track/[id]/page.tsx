import { Metadata } from 'next';
import { TrackingDetailClient } from '../../../../components/tracking/TrackingDetailClient';

export const metadata: Metadata = {
  title: 'حالة الطلب | إلكترو توب',
  description: 'تفاصيل حالة طلبك وتحديثاته.',
};

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <TrackingDetailClient id={id} />
    </main>
  );
}
