'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 font-tajawal">
      <span className="material-symbols-outlined text-[64px] text-error/30 mb-4 select-none">error</span>
      <h2 className="font-bold text-xl text-on-surface mb-2">حدث خطأ أثناء تحميل المنتج</h2>
      <p className="text-on-surface-variant text-sm mb-8 max-w-md">
        نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى أو العودة للمتجر.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/shop"
          className="bg-surface-container-low border border-outline-variant text-on-surface px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container transition-colors"
        >
          العودة للمتجر
        </Link>
      </div>
    </div>
  );
}
