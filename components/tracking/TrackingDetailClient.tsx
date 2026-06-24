'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useProducts } from '@/hooks/useProducts';
import { StatusTimeline } from '@/components/tracking/StatusTimeline';
import { formatCurrency } from '@/lib/format-currency';
import { formatOrderDate } from '@/lib/date-utils';
import { getSafeUrl } from '@/lib/safe-url';
import type { Order, OrderItem, OrderStatusHistory } from '@/types';
import { translateStatus, publicStatus } from '@/lib/status-utils';

interface TrackingDetailClientProps {
  id: string;
}

export function TrackingDetailClient({ id }: TrackingDetailClientProps) {
  const router = useRouter();
  const { order, items: orderItems, history: statusHistory, loading } = useOrderTracking(id);
  const { getProductsMap } = useProducts();

  // Single batch lookup — avoids per-item function call overhead
  const productsById = getProductsMap();

  const [retryId, setRetryId] = useState('');
  const [retryError, setRetryError] = useState('');

  const handleRetrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = retryId.trim().toUpperCase();

    if (!cleanId) {
      setRetryError('الرجاء إدخال رقم التتبع الخاص بك.');
      return;
    }

    if (!cleanId.startsWith('ET-') || cleanId.length !== 13) {
      setRetryError('رقم تتبع غير صحيح. يجب أن يبدأ رقم التتبع بـ "ET-" متبوعاً بـ 10 رموز (مثال: ET-A1B2C3D4E5).');
      return;
    }

    setRetryError('');
    router.push(`/track/${cleanId}`);
    setRetryId('');
  };

  if (loading) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center font-poppins">
        <p className="text-on-surface-variant text-sm">جاري البحث في قاعدة بيانات تتبع طلبات إلكترو توب...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-margin-mobile py-16 text-center font-poppins space-y-6">
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 rounded-xl shadow-xl text-start space-y-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200 text-amber-600">
              <span className="material-symbols-outlined text-4xl select-none">warning</span>
            </div>
          </div>
          
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-montserrat font-extrabold text-on-surface">
              لم يتم العثور على الطلب
            </h2>
            <p className="text-sm text-on-surface-variant">
              رقم التتبع هذا غير موجود. يرجى التحقق من رقم التتبع (مثال: ET-A1B2C3D4E5) والمحاولة مرة أخرى.
            </p>
          </div>

          <form onSubmit={handleRetrySubmit} className="space-y-3 pt-2">
            <input
              className={`w-full bg-white border rounded-lg p-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline-variant uppercase tracking-widest text-center font-mono font-semibold text-on-surface ${
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
            <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all uppercase tracking-widest cursor-pointer">
              جرب رقم تتبع آخر
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/track" className="group inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="material-symbols-outlined select-none rotate-180">arrow_back</span>
              <span className="group-hover:underline">العودة</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColorInfo = (() => {
    const displayStatus = publicStatus(order.status);
    switch (displayStatus) {
      case 'Pending Review':
        return { dot: 'bg-yellow-400', text: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/20' };
      case 'Accepted':
        return { dot: 'bg-blue-500', text: 'text-blue-700 bg-blue-500/10 border-blue-500/20' };
      case 'Processing':
        return { dot: 'bg-purple-500', text: 'text-purple-700 bg-purple-500/10 border-purple-500/20' };
      case 'Delivered':
        return { dot: 'bg-green-500', text: 'text-green-700 bg-green-500/10 border-green-200' };
      case 'Declined':
        return { dot: 'bg-red-500', text: 'text-red-700 bg-red-500/10 border-red-200' };
      default:
        return { dot: 'bg-gray-500', text: 'text-gray-700 bg-gray-500/10 border-gray-200' };
    }
  })();

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 font-poppins">
      <div className="mb-8 flex justify-start">
        <Link href="/track" className="group flex items-center gap-2 text-primary font-label-md w-fit">
          <span className="material-symbols-outlined select-none rotate-180">arrow_back</span>
          <span className="group-hover:underline">العودة إلى تتبع الشحنات</span>
        </Link>
      </div>

      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/30 pb-6 text-start">
        <div>
          <span className="text-primary font-label-md uppercase tracking-widest text-xs font-semibold">
            حالة التتبع
          </span>
          <h1 className="font-headline-lg text-headline-lg mt-2 text-on-surface uppercase tracking-tight">
            طلب رقم {order.id_unique_tracking}
          </h1>
        </div>
        
        <div className={`px-6 py-3 rounded-full flex items-center gap-3 border ${statusColorInfo.text} shrink-0 w-fit`}>
          <span className={`w-3 h-3 rounded-full pulsing-dot ${statusColorInfo.dot}`}></span>
          <span className="font-label-md text-label-md font-bold">
            الحالة الحالية: {translateStatus(order.status, true)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2">
          <StatusTimeline 
            currentStatus={publicStatus(order.status)} 
            statusHistory={statusHistory} 
          />
        </div>

        <div className="space-y-6">
          <div className="bg-on-background text-surface rounded-xl p-8 shadow-xl text-start space-y-5">
            <div className="flex justify-between items-start border-b border-surface/20 pb-4 mb-2">
              <h3 className="font-headline-md text-headline-md text-secondary-fixed">
                تفاصيل الفاتورة
              </h3>
              <div className="text-left">
                <p className="text-surface-variant font-label-sm text-[10px] uppercase tracking-widest">رقم الطلب</p>
                <p className="font-mono text-xs font-bold text-white tracking-wider">{order.id_unique_tracking}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-surface-variant text-xs">
              <span className="material-symbols-outlined text-[14px] select-none">calendar_today</span>
              <span>
                {formatOrderDate(order.created_at)}
                {' — '}
                {new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pe-1">
              {orderItems.map((item) => {
                const product = productsById.get(item.product_id);
                const name = product ? product.name : 'عنصر غير معروف';
                const imageUrl = product ? product.image_url : null;

                return (
                  <div key={item.id} className="flex items-center gap-4 text-white">
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          className="object-contain p-1 pointer-events-none select-none"
                          sizes="64px"
                          quality={75}
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                          <span className="material-symbols-outlined text-on-surface-variant text-[28px] select-none">inventory_2</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md text-white truncate">
                        {name}
                      </p>
                      <p className="text-surface-variant font-label-sm">الكمية: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                    </div>
                    <p className="font-bold shrink-0 font-mono">{formatCurrency(item.unit_price * item.quantity)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-surface/20 pt-5 mt-4 space-y-2 text-sm text-white">
              <div className="flex justify-between items-center">
                <span className="text-surface-variant">المجموع الفرعي</span>
                <span className="font-mono">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-surface-variant">الشحن</span>
                <span className="font-bold text-xs text-[var(--color-status-delivered)]">مجاني</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-surface/20 mt-1">
                <span className="font-headline-md text-headline-md">الإجمالي</span>
                <span className="font-headline-lg text-headline-lg text-secondary-fixed gold-glow font-mono">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface/10 flex items-center gap-2 text-surface-variant text-xs">
              <span className="material-symbols-outlined text-[14px] select-none">payments</span>
              <span>تم الدفع عبر إنستاباي (InstaPay)</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 rounded-xl text-start space-y-4">
            <div>
              <h4 className="font-headline-md text-headline-md mb-3 text-on-surface">عنوان التوصيل</h4>
              <p className="text-on-surface-variant text-body-md leading-relaxed whitespace-pre-line text-start">
                {order.customer_name}
                {'\n'}
                {order.shipping_address}
              </p>
            </div>

            {order.location_link && getSafeUrl(order.location_link) && (
              <div className="pt-3 border-t border-outline-variant/20">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-1">
                  رابط الموقع الجغرافي
                </p>
                <a
                  href={getSafeUrl(order.location_link)!}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group inline-flex items-center gap-1.5 text-primary font-body-md text-body-md font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">map</span>
                  <span className="group-hover:underline">عرض الموقع الجغرافي المرسل</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
