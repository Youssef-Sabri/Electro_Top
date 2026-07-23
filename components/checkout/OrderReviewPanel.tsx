'use client';

import Image from 'next/image';
import type { CartItem } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface OrderReviewPanelProps {
  items: CartItem[];
  total: number;
  isSubmitting: boolean;
  cooldown: number;
}

export function OrderReviewPanel({ items, total, isSubmitting, cooldown }: OrderReviewPanelProps) {
  return (
    <div className="lg:w-1/3">
      <div className="bg-on-background text-secondary-fixed rounded-2xl p-8 shadow-lg sticky top-24 text-start">
        <h2 className="font-bold text-[18px] mb-6 text-secondary-fixed pb-4 border-b border-surface-variant/10">
          المراجعة النهائية
        </h2>
        
        <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pe-1">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.selectedColor || 'default'}`} className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg border border-white/10 relative overflow-hidden bg-white shrink-0">
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  className="object-contain p-1 pointer-events-none select-none"
                  sizes="48px"
                  quality={75}
                  draggable={false}
                />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs font-bold truncate text-white">{item.product.name}</p>
                <p className="text-white/50 text-[11px] mt-0.5">الكمية: {item.quantity}</p>
                {item.selectedColor && (
                  <p className="text-white/50 text-[10px]">اللون: {item.selectedColor}</p>
                )}
              </div>
              <p className="font-bold text-xs shrink-0">{formatCurrency(item.product.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-8 pt-4 border-t border-surface-variant/10">
          <div className="flex justify-between text-xs text-white/60">
            <span>المجموع الفرعي</span>
            <span className="font-mono tabular-nums">{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-between text-xs text-electro-gold">
            <span className="font-bold">المبلغ الإجمالي المطلوب</span>
            <span className="text-[26px] font-bold gold-glow leading-none font-mono tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || cooldown > 0}
          aria-label="تأكيد الطلب الآن"
          className="w-full bg-[#CA202B] hover:bg-[#b01b24] text-white py-4 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin select-none text-[18px]">sync</span>
              جاري إرسال الطلب...
            </>
          ) : cooldown > 0 ? (
            <>
              <span className="material-symbols-outlined select-none text-[18px]">timer</span>
              انتظر {cooldown} ثانية
            </>
          ) : (
            'تأكيد الطلب الآن'
          )}
        </button>
      </div>
    </div>
  );
}
