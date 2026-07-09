import { Metadata } from 'next';
import { Suspense } from 'react';
import { ConfirmationClient } from '@/components/checkout/ConfirmationClient';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'تم تأكيد الطلب | إلكترو توب',
  description: 'تم تأكيد طلبك بنجاح. شكراً لاختياركم إلكترو توب.',
};

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-white py-12 flex items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 font-tajawal">
          <Spinner className="h-10 w-10 mb-4" />
          <p className="text-on-surface-variant text-sm">جاري تحميل تفاصيل تأكيد الطلب...</p>
        </div>
      }>
        <ConfirmationClient />
      </Suspense>
    </main>
  );
}
