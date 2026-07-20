import { Metadata } from 'next';
import { Suspense } from 'react';
import { ConfirmationClient } from '@/components/checkout/ConfirmationClient';
import StoreLoading from '@/app/(store)/loading';

export const metadata: Metadata = {
  title: 'تم تأكيد الطلب | إلكترو توب',
  description: 'تم تأكيد طلبك بنجاح. شكراً لاختياركم إلكترو توب.',
  robots: { index: false },
};

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-white py-12 flex items-center justify-center">
      <Suspense fallback={<StoreLoading />}>
        <ConfirmationClient />
      </Suspense>
    </main>
  );
}
