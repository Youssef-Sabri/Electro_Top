'use client';

import React, { memo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { normalizeTrackingId, isValidTrackingId } from '@/lib/utils/misc';

export const TrackingSearch = memo(function TrackingSearch() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanId = normalizeTrackingId(trackingId);

    if (!cleanId) {
      setError('الرجاء إدخال رقم التتبع الخاص بك.');
      return;
    }

    if (!isValidTrackingId(cleanId)) {
      setError('رقم تتبع غير صحيح. يجب أن يبدأ بـ "ET-" متبوعاً بـ 10 رموز (مثال: ET-A1B2C3D4E5).');
      return;
    }

    setError('');
    router.push(`/track/${cleanId}`);
  }, [router, trackingId]);

  return (
    <section className="py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low min-h-[80vh] flex items-center font-tajawal text-on-surface">
      <div className="max-w-max-width mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        {/* Description panel */}
        <div className="space-y-8 text-start">
           <Image
             alt="شعار إلكترو توب"
             className="h-12 md:h-16 w-auto object-contain mix-blend-multiply select-none"
             src="/logo.png"
             width={64}
             height={64}
             style={{ width: 'auto' }}
           />
          <h1 className="font-bold text-[36px] md:text-[46px] leading-tight text-on-surface">
            تتبع شحنة <br />
            <span className="text-primary">مستلزماتك الكهربائية.</span>
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
            أدخل رقم التتبع الفريد الخاص بك لمراقبة الحالة الحقيقية لشحنة المكونات الكهربائية الخاصة بك في الوقت الفعلي.
          </p>
        </div>

        {/* Input Card panel */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-outline-variant/40 shadow-md text-start">
          <h2 className="font-bold text-[20px] mb-8 text-on-surface border-b border-outline-variant/30 pb-3 w-fit">تتبع الشحنة</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold mb-2.5 text-on-surface-variant uppercase tracking-wider">
                رقم الطلب (التتبع)
              </label>
              <input
                className={`w-full bg-surface-container-low border rounded-xl p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50 uppercase tracking-widest text-center font-mono font-semibold text-on-surface text-sm ${
                  error ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
                }`}
                placeholder="ET-A1B2C3D4E5"
                type="text"
                dir="ltr"
                value={trackingId}
                onChange={(e) => {
                  setTrackingId(e.target.value);
                  if (error) setError('');
                }}
              />
              {error && (
                <p className="text-xs text-error font-medium mt-1.5">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 rounded-xl font-bold hover:shadow-md transition-all text-sm cursor-pointer"
            >
              تتبع الطلب
            </button>
          </form>
        </div>

      </div>
    </section>
  );
});
TrackingSearch.displayName = 'TrackingSearch';
