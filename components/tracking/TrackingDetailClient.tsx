'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useProducts } from '@/hooks/useProducts';
import { StatusTimeline } from '@/components/tracking/StatusTimeline';
import { formatCurrency } from '@/lib/format-currency';
import { formatOrderDate } from '@/lib/date-utils';
import { getSafeUrl } from '@/lib/safe-url';
import { getColorHex } from '@/lib/color-palette';
import { normalizeTrackingId, isValidTrackingId } from '@/lib/constants';
import { translateStatus, publicStatus } from '@/lib/status-utils';

interface TrackingDetailClientProps {
  id: string;
}

export function TrackingDetailClient({ id }: TrackingDetailClientProps) {
  const router = useRouter();
  const { order, items: orderItems, history: statusHistory, loading } = useOrderTracking(id);
  const { getProductsMap } = useProducts();

  const productsById = getProductsMap();

  const [retryId, setRetryId] = useState('');
  const [retryError, setRetryError] = useState('');

  const statusColorInfo = useMemo(() => {
    const displayStatus = publicStatus(order?.status ?? 'Accepted');
    switch (displayStatus) {
      case 'Pending Review':
        return { dot: 'bg-yellow-400', text: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
      case 'Accepted':
        return { dot: 'bg-[var(--color-status-accepted)]', text: 'text-[var(--color-status-accepted)] bg-[var(--color-status-accepted)]/10 border-[var(--color-status-accepted)]/30' };
      case 'Processing':
        return { dot: 'bg-purple-500', text: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'Delivered':
        return { dot: 'bg-[var(--color-status-delivered)]', text: 'text-[var(--color-status-delivered)] bg-[var(--color-status-delivered)]/10 border-[var(--color-status-delivered)]/30' };
      case 'Declined':
        return { dot: 'bg-[var(--color-status-declined)]', text: 'text-[var(--color-status-declined)] bg-[var(--color-status-declined)]/10 border-[var(--color-status-declined)]/30' };
      default:
        return { dot: 'bg-on-surface-variant/50', text: 'text-on-surface bg-surface-container-low border-outline-variant' };
    }
  }, [order?.status]);

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = normalizeTrackingId(retryId);

    if (!cleanId) {
      setRetryError('الرجاء إدخال رقم التتبع الخاص بك.');
      return;
    }

    if (!isValidTrackingId(cleanId)) {
      setRetryError('رقم تتبع غير صحيح. يجب أن يبدأ بـ "ET-" متبوعاً بـ 10 رموز (مثال: ET-A1B2C3D4E5).');
      return;
    }

    setRetryError('');
    router.push(`/track/${cleanId}`);
    setRetryId('');
  };

  if (loading) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center font-tajawal">
        <p className="text-on-surface-variant text-sm">جاري البحث في قاعدة بيانات تتبع طلبات إلكترو توب...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-margin-mobile py-16 text-center font-tajawal space-y-6">
        <div className="bg-white p-8 border border-outline-variant/40 rounded-2xl shadow-sm text-start space-y-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center border border-error/20 text-error">
              <span className="material-symbols-outlined text-4xl select-none">warning</span>
            </div>
          </div>
          
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-on-surface">
              لم يتم العثور على الطلب
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              رقم التتبع هذا غير موجود. يرجى التحقق من رقم التتبع (مثال: ET-A1B2C3D4E5) والمحاولة مرة أخرى.
            </p>
          </div>

          <form onSubmit={handleRetrySubmit} className="space-y-3 pt-2">
            <input
              className={`w-full bg-surface-container-low border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50 uppercase tracking-widest text-center font-mono font-semibold text-on-surface text-sm ${
                retryError ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
              }`}
              placeholder="ET-A1B2C3D4E5"
              type="text"
              dir="ltr"
              value={retryId}
              onChange={(e) => {
                setRetryId(e.target.value);
                if (retryError) setRetryError('');
              }}
            />
            {retryError && (
              <p className="text-xs text-error font-medium">{retryError}</p>
            )}
            <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition-all text-xs cursor-pointer">
              جرب رقم تتبع آخر
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/track" className="group inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="material-symbols-outlined select-none rotate-180 text-[18px]">arrow_back</span>
              <span className="group-hover:underline">العودة للتتبع</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 font-tajawal text-on-surface">
      <div className="mb-8 flex justify-start">
        <Link href="/track" className="group flex items-center gap-2 text-primary font-bold text-sm w-fit">
          <span className="material-symbols-outlined select-none rotate-180 text-[18px]">arrow_back</span>
          <span className="group-hover:underline">العودة إلى تتبع الشحنات</span>
        </Link>
      </div>

      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/40 pb-6 text-start">
        <div>
          <span className="text-[#C6B254] font-bold text-xs uppercase tracking-widest">
            حالة الشحنة والتوصيل
          </span>
          <h1 className="font-bold text-[28px] md:text-[32px] mt-2 text-on-surface uppercase tracking-tight">
            طلب رقم {order.id_unique_tracking}
          </h1>
        </div>
        
        <div className={`px-5 py-2.5 rounded-full flex items-center gap-2.5 border ${statusColorInfo.text} shrink-0 w-fit`}>
          <span className={`w-2.5 h-2.5 rounded-full pulsing-dot ${statusColorInfo.dot}`}></span>
          <span className="font-bold text-xs">
            الحالة الحالية: {translateStatus(order.status, true)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline block */}
        <div className="lg:col-span-2">
          <StatusTimeline 
            currentStatus={publicStatus(order.status)} 
            statusHistory={statusHistory} 
          />
        </div>

        {/* Invoice Summary block */}
        <div className="space-y-6">
          <div className="bg-on-background text-secondary-fixed rounded-2xl p-8 shadow-lg text-start space-y-5">
            <div className="flex justify-between items-start border-b border-surface-variant/10 pb-4 mb-2">
              <h3 className="font-bold text-[18px] text-secondary-fixed">
                تفاصيل الفاتورة
              </h3>
              <div className="text-left">
                <p className="text-surface-variant/80 text-[10px] uppercase font-bold tracking-wider mb-0.5">رقم الطلب</p>
                <p className="font-mono text-xs font-bold text-white tracking-wider">{order.id_unique_tracking}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-surface-variant/80 text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px] select-none text-electro-gold">calendar_today</span>
              <span>
                {formatOrderDate(order.created_at)}
                {' — '}
                {new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pe-1">
              {orderItems.map((item) => {
                const product = productsById.get(item.product_id);
                const name = product ? product.name : (item.product_name || 'عنصر غير معروف');
                const imageUrl = product ? product.image_url : (item.product_image || null);

                return (
                  <div key={item.id} className="flex items-center gap-4 text-white">
                    <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          className="object-contain p-1 pointer-events-none select-none"
                          sizes="56px"
                          quality={75}
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container">
                          <span className="material-symbols-outlined text-on-surface-variant text-[24px] select-none">inventory_2</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {name}
                      </p>
                      {item.selected_color && (
                        <p className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full border border-white/10 shadow-sm" style={{
                            background: getColorHex(item.selected_color)
                          }} />
                          اللون: {item.selected_color}
                        </p>
                      )}
                      <p className="text-on-surface-variant text-[11px] mt-0.5">الكمية: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                    </div>
                    <p className="font-bold text-xs shrink-0 font-mono">{formatCurrency(item.unit_price * item.quantity)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-surface-variant/10 pt-5 mt-4 space-y-2 text-sm text-white">
              <div className="flex justify-between items-center text-xs text-surface-variant/80">
                <span>المجموع الفرعي</span>
                <span className="font-mono">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-surface-variant/80">
                <span>الشحن</span>
                <span className="font-bold text-green-400">مجاني</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-surface-variant/10 mt-1">
                <span className="font-bold text-sm">الإجمالي النهائي</span>
                <span className="font-bold text-electro-gold text-[22px] font-mono leading-none">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-variant/10 flex items-center gap-2 text-surface-variant/80 text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px] select-none">payments</span>
              <span>
                {order.payment_method === 'cod'
                  ? 'الدفع عند الاستلام (Cash on Delivery)'
                  : order.payment_method === 'instapay'
                    ? 'تم الدفع عبر إنستاباي (InstaPay)'
                    : 'طريقة الدفع غير محددة'}
              </span>
            </div>
          </div>

          {/* Delivery Details card */}
          <div className="bg-surface-container-low p-8 border border-outline-variant/40 rounded-2xl text-start space-y-4">
            <div>
              <h4 className="font-bold text-[16px] mb-3 text-on-surface">عنوان التوصيل</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line text-start">
                {order.customer_name}
                {'\n'}
                {order.shipping_address}
              </p>
            </div>

            {order.location_link && getSafeUrl(order.location_link) && (
              <div className="pt-3 border-t border-outline-variant/30">
                <a
                  href={getSafeUrl(order.location_link)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-primary font-bold text-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">map</span>
                  <span className="group-hover:underline">عرض الموقع على الخريطة</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
