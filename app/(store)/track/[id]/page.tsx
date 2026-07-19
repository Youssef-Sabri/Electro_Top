import { Metadata } from 'next';
import { TrackingDetailClient } from '@/components/tracking/TrackingDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const trackingId = id.toUpperCase();
  return {
    title: `طلب #${trackingId} | تتبع الحالة`,
    description: `تتبع حالة طلبك رقم ${trackingId} والاطلاع على آخر التحديثات من إلكترو توب.`,
    alternates: {
      canonical: `/track/${id}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <TrackingDetailClient id={id} />
    </main>
  );
}
