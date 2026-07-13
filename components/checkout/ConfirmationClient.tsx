'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils/format';
import { formatOrderDate, formatOrderTimestamp } from '@/lib/utils/date';
import { getSafeUrl, getSupportEnv } from '@/lib/utils/misc';

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  const { order, items, loading } = useOrderTracking(orderId);
  const { getProductsMap } = useProducts();
  const { whatsapp: whatsappNumbers, phone: phoneNumbers, email: supportEmail } = getSupportEnv();

  const productsById = getProductsMap();
  
  const [copied, setCopied] = useState(false);
  const [cachedOrder, setCachedOrder] = useState<{
    customer_name: string;
    phone_number: string;
    shipping_address: string;
    location_link?: string;
    instapay_phone_number?: string;
  } | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (orderId) {
      try {
        const stored = sessionStorage.getItem(`last-order-${orderId}`);
        if (stored) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCachedOrder(JSON.parse(stored));
        }
      } catch {}
    }
  }, [orderId]);

  const displayOrder = order ? {
    ...order,
    ...(cachedOrder ? {
      customer_name: cachedOrder.customer_name,
      phone_number: cachedOrder.phone_number,
      shipping_address: cachedOrder.shipping_address,
      location_link: cachedOrder.location_link,
      instapay_phone_number: cachedOrder.instapay_phone_number,
    } : {})
  } : null;

  const resetCopiedAfter = () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = (text: string) => {
    if (typeof window === 'undefined') return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          resetCopiedAfter();
        })
        .catch((err) => {
          if (process.env.NODE_ENV !== 'production') console.error('Clipboard copy failed:', err);
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      if (successful) {
        setCopied(true);
        resetCopiedAfter();
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Fallback copy failed:', err);
    }
  };

  if (loading || !orderId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 font-tajawal">
        <div className="flex justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin select-none">sync</span>
        </div>
        <p className="text-on-surface-variant text-sm">جاري تحميل تفاصيل تأكيد طلبك...</p>
      </div>
    );
  }

  if (!displayOrder) {
    return (
      <div className="max-w-md mx-auto px-margin-mobile py-20 text-center font-tajawal space-y-6">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center border border-error/20 text-primary">
            <span className="material-symbols-outlined text-4xl select-none">warning</span>
          </div>
        </div>
        <h2 className="font-bold text-[24px]">لم يتم العثور على الطلب</h2>
        <p className="text-on-surface-variant text-sm">
          لم نتمكن من العثور على أي طلب برقم التتبع{' '}
          <span className="font-semibold text-on-surface">&quot;{orderId || 'N/A'}&quot;</span>.
        </p>
        <Link
          href="/"
          className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:opacity-90 inline-block text-xs"
        >
          العودة إلى المتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-center py-12 px-margin-mobile md:px-margin-desktop font-tajawal">
      <div className="mb-8 flex justify-center">
        <div className="w-20 h-20 bg-[var(--color-status-delivered)]/10 rounded-full flex items-center justify-center">
          <span
            className="material-symbols-outlined text-5xl text-[var(--color-status-delivered)] select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
      </div>

      <h1 className="font-bold text-[28px] md:text-[32px] mb-2 text-on-surface">تم تأكيد طلبك بنجاح!</h1>
      <p className="text-on-surface-variant text-sm mb-10 leading-relaxed">
        جاري تجهيز طلبك من إلكترو توب للشحن والتوصيل.
      </p>

      {/* Sleek success code box (Warm dark themed) */}
      <div className="bg-on-background p-10 rounded-2xl shadow-md mb-12 transform hover:scale-[1.01] transition-transform duration-300 relative text-center">
        <p className="text-surface-variant/80 text-xs uppercase tracking-widest mb-3 font-semibold">رقم التتبع الخاص بك</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <h2 className="font-bold text-[32px] md:text-[40px] text-electro-gold tracking-widest uppercase leading-none">
            {displayOrder.id_unique_tracking}
          </h2>
          <button
            type="button"
            onClick={() => handleCopy(displayOrder.id_unique_tracking)}
            className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/5 active:scale-95 shrink-0"
            title="نسخ رقم التتبع"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
        {copied && (
          <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mt-2.5 animate-pulse">
            تم النسخ إلى الحافظة!
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto mb-12 space-y-4 text-center">
        <p className="text-xs font-bold text-on-surface leading-relaxed">
          🚨 <span className="text-primary font-extrabold">يرجى نسخ رقم التتبع الخاص بك أو التقاط لقطة شاشة</span> لهذه الصفحة لتتمكن من تتبع طلبك لاحقاً.
        </p>
        
        <div className="pt-2">
          <p className="text-[11px] text-on-surface-variant font-medium mb-3">
            لأي استفسار أو واجهت مشكلة، تواصل معنا مباشرة:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {whatsappNumbers.map((number, index) => (
              <a
                key={index}
                href={`https://wa.me/${number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-emerald-200/40 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">chat</span>
                <span>واتساب {whatsappNumbers.length > 1 && `(${index + 1})`}</span>
              </a>
            ))}
            {phoneNumbers.map((number, index) => (
              <a
                key={index}
                href={`tel:${number}`}
                className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-red-200/40 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">phone</span>
                <span>اتصال {phoneNumbers.length > 1 && `(${index + 1})`}</span>
              </a>
            ))}
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-cyan-200/40 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-cyan-600">mail</span>
                <span>البريد الإلكتروني</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Invoice details */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-8 mb-12 text-start">
        <div className="flex justify-between items-start mb-6 border-b border-outline-variant/30 pb-4">
          <h3 className="font-bold text-[18px] text-on-surface">
            تفاصيل الطلب
          </h3>
          <div className="text-left">
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider mb-0.5">رقم الطلب</p>
            <p className="font-mono text-xs font-bold text-on-surface tracking-wider">{displayOrder.id_unique_tracking}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-5 font-semibold">
          <span className="material-symbols-outlined text-[15px] text-primary select-none">calendar_today</span>
          <span>
            {formatOrderDate(displayOrder.created_at)}
            {' — '}
            {formatOrderTimestamp(displayOrder.created_at)}
          </span>
        </div>

        <div className="mb-6 space-y-2 text-sm text-on-surface-variant text-start font-medium">
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary select-none mt-0.5">person</span>
            <span>{displayOrder.customer_name}</span>
          </div>
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary select-none mt-0.5">location_on</span>
            <span>{displayOrder.shipping_address}</span>
          </div>
          {displayOrder.location_link && getSafeUrl(displayOrder.location_link) && (
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary select-none mt-0.5">map</span>
              <a
                href={getSafeUrl(displayOrder.location_link)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                عرض الموقع على الخريطة
              </a>
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-outline-variant/30 pt-4">
          {items.length > 0 ? (
            items.map((item) => {
              const product = productsById.get(item.product_id);
              return (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-on-surface font-semibold">
                      {product ? product.name : item.product_id}
                    </span>
                    {item.selected_color && (
                      <p className="text-on-surface-variant text-[11px] mt-0.5">اللون: {item.selected_color}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-on-surface-variant text-xs">×{item.quantity} — {formatCurrency(item.unit_price)}</span>
                    <span className="font-bold text-on-surface font-mono">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
                <p className="text-on-surface-variant text-sm">لم يتم العثور على أي منتجات لهذا الطلب.</p>
          )}

          <div className="pt-4 border-t border-outline-variant/30 space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
              <span>المجموع الفرعي</span>
              <span className="font-mono">{formatCurrency(displayOrder.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
              <span>التوصيل</span>
              <span className="text-[var(--color-status-delivered)] font-bold">مجاني</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30 mt-1">
              <span className="font-bold text-base text-on-surface">الإجمالي النهائي</span>
              <span className="font-bold text-primary text-[20px] font-mono leading-none">
                {formatCurrency(displayOrder.total_amount)}
              </span>
            </div>
          </div>

           <div className="pt-3 border-t border-outline-variant/20 flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
             <span className="material-symbols-outlined text-[16px] text-primary select-none">payments</span>
              <span>
                {displayOrder.payment_method === 'cod' 
                  ? 'الدفع عند الاستلام (Cash on Delivery)' 
                  : displayOrder.payment_method === 'instapay'
                    ? 'تم الدفع عبر إنستاباي (InstaPay)'
                    : 'طريقة الدفع غير محددة'}
              </span>
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={`/track/${displayOrder.id_unique_tracking}`}
          className="bg-primary hover:bg-primary/95 text-white px-10 py-3.5 rounded-full font-bold text-sm transition-all inline-block"
        >
          تتبع شحنتي
        </Link>
        <Link
          href="/shop"
          className="border border-primary text-primary hover:bg-primary/5 px-10 py-3.5 rounded-full font-bold text-sm transition-all inline-block"
        >
          مواصلة التسوق
        </Link>
      </div>
    </div>
  );
}
