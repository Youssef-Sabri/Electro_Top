'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { formatCurrency } from '@/lib/format-currency';

export function CartClient() {
  const { items, total, itemCount } = useCart();
  const [isHydrated, setIsHydrated] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsHydrated(true); }, []);

  if (!isHydrated) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center font-poppins">
        <p className="text-on-surface-variant text-sm">جاري تحميل عربة تسوق إلكترو توب...</p>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-poppins">
        <div className="inline-flex items-center justify-center p-4 bg-surface-container rounded-full mb-6">
          <span className="material-symbols-outlined text-[48px] text-primary select-none">
            shopping_bag
          </span>
        </div>
        <h2 className="font-display-lg text-headline-lg text-on-surface mb-3">
          عربة التسوق فارغة
        </h2>
        <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
          يبدو أنك لم تقم بإضافة أي مستلزمات كهربائية إلى عربة التسوق بعد. دعنا نجد شيئاً مناسباً لك.
        </p>
        <Link href="/shop" className="bg-electro-red text-white px-8 py-3 rounded-lg font-label-md hover:scale-105 transition-transform duration-200 inline-block">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop font-poppins">
      <h1 className="font-headline-lg text-headline-lg mb-8 text-on-background text-start">
        مراجعة عربة التسوق
      </h1>
      
      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Item List (Right in RTL) - 2/3 width */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
          
          <div className="pt-6 flex justify-start">
            <Link href="/shop" className="group flex items-center gap-2 text-primary font-label-md">
              <span className="material-symbols-outlined select-none rotate-180">arrow_back</span>
              <span className="group-hover:underline">مواصلة التسوق</span>
            </Link>
          </div>
        </div>

        {/* Order Summary (Left in RTL) - 1/3 width */}
        <div className="lg:w-1/3">
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm sticky top-24 text-start">
            <h2 className="font-headline-md text-headline-md mb-6 border-b border-outline-variant/30 pb-4">
              ملخص الطلب
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between font-label-md text-on-surface-variant">
                <span>المجموع الفرعي ({itemCount} منتج)</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between font-label-md text-on-surface-variant">
                <span>التوصيل العادي</span>
                <span className="text-green-600 font-bold">مجاني</span>
              </div>
              
              <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end">
                <span className="font-headline-md text-on-surface">الإجمالي</span>
                <span className="font-display-lg text-primary text-[32px]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-lg font-headline-md text-body-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              الاستمرار في الدفع
              <span className="material-symbols-outlined select-none rotate-180">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
