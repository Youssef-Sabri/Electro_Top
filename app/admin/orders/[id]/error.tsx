'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function OrderDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Order detail error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 font-tajawal">
      <span className="material-symbols-outlined text-[64px] text-error/30 mb-4 select-none">error</span>
      <h2 className="font-bold text-xl text-on-surface mb-2">حدث خطأ أثناء تحميل تفاصيل الطلب</h2>
      <p className="text-on-surface-variant text-sm mb-8 max-w-md">
        يرجى المحاولة مرة أخرى أو العودة لصفحة الطلبات.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/admin/orders"
          className="bg-surface-container-low border border-outline-variant text-on-surface px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container transition-colors"
        >
          العودة للطلبات
        </Link>
      </div>
    </div>
  );
}
