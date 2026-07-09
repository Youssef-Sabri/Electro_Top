'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { formatCurrency } from '@/lib/format-currency';

export function CartClient() {
  const { items, total, itemCount } = useCart();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => { 
    setIsHydrated(true); 
  }, []);

  if (!isHydrated) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center font-tajawal">
        <p className="text-on-surface-variant text-sm">جاري تحميل عربة تسوق إلكترو توب...</p>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-tajawal">
        <div className="inline-flex items-center justify-center p-5 bg-surface-container-low border border-outline-variant/30 rounded-full mb-6">
          <span className="material-symbols-outlined text-[48px] text-primary select-none">
            shopping_bag
          </span>
        </div>
        <h2 className="font-bold text-[24px] text-on-surface mb-3">
          عربة التسوق فارغة
        </h2>
        <p className="text-on-surface-variant text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          يبدو أنك لم تقم بإضافة أي مستلزمات كهربائية إلى عربة التسوق بعد. دعنا نساعدك في العثور على ما تحتاجه.
        </p>
        <Link href="/shop" className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-full font-bold hover:shadow-md transition-all duration-200 inline-block text-sm">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 font-tajawal">
      <h1 className="font-bold text-[28px] md:text-[32px] mb-8 text-on-background text-start">
        عربة التسوق
      </h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items List */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          {items.map((item) => (
            <CartItem key={`${item.product.id}-${item.selectedColor || 'default'}`} item={item} />
          ))}
          
          <div className="pt-6 flex justify-start">
            <Link href="/shop" className="group flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined select-none rotate-180 text-[18px]">arrow_back</span>
              <span className="group-hover:underline">مواصلة التسوق</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Panel */}
        <div className="lg:w-1/3">
          <div className="bg-white border border-outline-variant/40 rounded-2xl p-8 shadow-sm sticky top-24 text-start">
            <h2 className="font-bold text-[20px] mb-6 border-b border-outline-variant/30 pb-4">
              ملخص الطلب
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm text-on-surface-variant font-semibold">
                <span>المجموع الفرعي ({itemCount} منتج)</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-on-surface-variant font-semibold">
                <span>الشحن والتوصيل</span>
                <span className="text-green-600 font-bold">مجاني</span>
              </div>
              
              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-end">
                <span className="font-bold text-on-surface text-base">الإجمالي النهائي</span>
                <span className="font-bold text-primary text-[28px] leading-none">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              الاستمرار في الدفع
              <span className="material-symbols-outlined select-none rotate-180 text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
