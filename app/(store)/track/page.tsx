import { Metadata } from 'next';
import { TrackingSearch } from '@/components/tracking/TrackingSearch';

export const metadata: Metadata = {
  title: 'تتبع طلبك | إلكترو توب',
  description: 'تتبع طلبك ومعرفة حالة التوصيل الحالية.',
  alternates: {
    canonical: '/track',
  },
};

export default function TrackPage() {
  return (
    <main className="min-h-[75vh] bg-white flex items-center justify-center py-12">
      <TrackingSearch />
    </main>
  );
}
