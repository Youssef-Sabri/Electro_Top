'use client';

import { memo, useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { z } from 'zod';
import type { OrderStatus, Order, OrderItem, OrderStatusHistory } from '@/types';
import { formatCurrency } from '@/lib/format-currency';
import { now, formatOrderDate } from '@/lib/date-utils';
import { getInitials } from '@/lib/string-utils';
import { STATUS_OPTIONS, translateStatus, translateHistoryStatus } from '@/lib/status-utils';
import { getSafeUrl } from '@/lib/safe-url';
import { devLog } from '@/lib/dev-log';
import { getSupportEnv } from '@/lib/env-utils';

import { Toast } from '@/components/ui/Toast';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';


const MAX_NOTES_LENGTH = 2000;

interface OrderDetailClientProps {
  id: string;
}

const signedUrlSchema = z.object({ signedUrl: z.string() });

async function fetchSignedUrl(filename: string, orderId: string): Promise<string> {
  const params = new URLSearchParams({ filename, orderId });
  const res = await fetch(`/api/admin/receipt-signed-url?${params}`);
  if (!res.ok) throw new Error(await res.text());
  const { signedUrl } = signedUrlSchema.parse(await res.json());
  return signedUrl;
}

export const OrderDetailClient = memo(function OrderDetailClient({ id }: OrderDetailClientProps) {
  const { getOrderById, getOrderItems, getStatusHistory, updateOrderStatus, updateAdminNotes } = useOrders();
  const { getProductsMap } = useProducts();

  // Single batch lookup — avoids per-item function call overhead for 50+ items
  const productsById = getProductsMap();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('Pending Review');
  const [notesValue, setNotesValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [signedScreenshotUrl, setSignedScreenshotUrl] = useState<string | null>(null);
  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { phone: phoneNumbers } = getSupportEnv();
  const primaryPhone = phoneNumbers[0] || '';
  const secondaryPhone = phoneNumbers[1] || '';

  useEffect(() => {
    return () => {
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const screenshot = order?.instapay_screenshot;
    if (!screenshot) {
      setSignedScreenshotUrl(null);
      return;
    }

    if (screenshot.startsWith('data:image/')) {
      setSignedScreenshotUrl(screenshot);
      return;
    }

    const isValidFilename = /^receipt-[a-z0-9]+\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(screenshot);
    if (!isValidFilename) {
      setSignedScreenshotUrl(null);
      return;
    }

    fetchSignedUrl(screenshot, order?.id_unique_tracking ?? '')
      .then(setSignedScreenshotUrl)
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to fetch signed URL for receipt:', err);
        setSignedScreenshotUrl(null);
      });
  }, [order?.instapay_screenshot, order?.id_unique_tracking]);

  useEffect(() => {
    const fromContext = getOrderById(id);
    if (fromContext) {
      setOrder(fromContext);
      setOrderItems(getOrderItems(id));
      setStatusHistory(getStatusHistory(id));
      setLoading(false);
      return;
    }

    const isValidId = /^ET-[A-Z0-9]{10}$/i.test(id);

    async function loadFromDB() {
      try {
        if (!isValidId) {
          setOrder(null);
          return;
        }

        const { order, items, history } = await fetch(`/api/admin/orders/${id}`).then(r => r.json());

        if (order) {
          setOrder(order);
          setOrderItems(items);
          setStatusHistory(history);
        } else {
          setOrder(null);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    loadFromDB();
  }, [id, getOrderById, getOrderItems, getStatusHistory]);

  // Ref to track last-saved notes value to prevent redundant Supabase writes
  const lastSavedNotes = useRef<string>('');

  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => {
        setSelectedStatus(order.status);
        const notes = order.admin_notes ?? '';
        setNotesValue(notes);
        lastSavedNotes.current = notes;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [order]);

  const sortedHistory = useMemo(() => {
    return [...statusHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [statusHistory]);

  const handleOpenScreenshot = async () => {
    const screenshot = order?.instapay_screenshot;
    if (!screenshot) return;

    if (screenshot.startsWith('data:image/')) {
      const newWindow = window.open();
      if (newWindow) {
        const img = newWindow.document.createElement('img');
        img.src = screenshot;
        img.style.cssText = 'max-width:100%;display:block;margin:auto';
        newWindow.document.body.style.cssText = 'margin:0;background:#fff';
        newWindow.document.body.appendChild(img);
      }
      return;
    }

    const isValidFilename = /^receipt-[a-z0-9]+\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(screenshot);
    if (!isValidFilename) return;

    try {
      const signedUrl = await fetchSignedUrl(screenshot, order?.id_unique_tracking ?? '');
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Error fetching fresh signed URL:', err);
    }
  };

  const handleSaveChanges = () => {
    if (!order) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!order) return;
    setIsConfirmOpen(false);
    setIsSaving(true);
    try {
      await updateOrderStatus(order.id_unique_tracking, selectedStatus);
      
      // Update local state variables immediately
      setOrder((prev) => prev ? { ...prev, status: selectedStatus } : null);
      const timestamp = now();
      const newHistoryEntry: OrderStatusHistory = {
        id: `h-${order.id_unique_tracking}-${Date.now()}`,
        order_id: order.id_unique_tracking,
        status: selectedStatus,
        timestamp,
      };
      setStatusHistory((prev) => [...prev, newHistoryEntry]);

      setToastMessage('تم حفظ تغييرات الطلب بنجاح ✓');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error(err);
      setToastMessage('فشل حفظ تغييرات الطلب');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesBlur = async () => {
    if (!order) return;
    // Only save if the notes value actually changed — avoids redundant DB writes on every click away
    if (notesValue === lastSavedNotes.current) return;
    if (notesValue.length > MAX_NOTES_LENGTH) {
      setToastMessage('ملاحظات المسؤول تجاوزت الحد الأقصى المسموح به (2000 حرف).');
      setToastType('error');
      setShowToast(true);
      return;
    }
    try {
      lastSavedNotes.current = notesValue;
      await updateAdminNotes(order.id_unique_tracking, notesValue);
      setOrder((prev) => prev ? { ...prev, admin_notes: notesValue } : null);
      setToastMessage('تم حفظ ملاحظات المسؤول تلقائياً ✓');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      devLog(err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-tajawal text-on-surface-variant">
        <p className="text-sm">جاري جلب تفاصيل الطلب...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-margin-mobile py-20 text-center font-tajawal">
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 rounded-xl shadow-xl text-start space-y-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 text-primary">
              <span className="material-symbols-outlined text-4xl select-none">gpp_maybe</span>
            </div>
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-montserrat font-extrabold text-on-surface">لم يتم العثور على الطلب</h2>
            <p className="text-sm text-on-surface-variant">
              رقم تتبع الطلب <span className="font-semibold text-on-surface">&quot;{id}&quot;</span> غير موجود في قاعدة بيانات الطلبات.
            </p>
          </div>
          <div className="text-center pt-2">
            <Link href="/admin/orders" className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md hover:opacity-90 inline-block uppercase tracking-wider">
              العودة إلى جميع الطلبات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderDate = formatOrderDate(order.created_at);
  const orderTime = new Date(order.created_at).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <section className="space-y-gutter font-tajawal text-start print:hidden">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="flex items-center gap-2 text-primary font-label-md hover:translate-x-[4px] transition-transform">
          <span className="material-symbols-outlined select-none rotate-180">arrow_back</span> العودة إلى جميع الطلبات
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-start">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            تفاصيل الطلب <span className="text-secondary-fixed-dim">#{order.id_unique_tracking}</span>
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            تم تقديمه في {orderDate} الساعة {orderTime}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const originalTitle = document.title;
              document.title = `فاتورة-${order.id_unique_tracking}`;
              
              // Short delay to allow browser/OS print interface to register the updated title
              if (printTimerRef.current) clearTimeout(printTimerRef.current);
              printTimerRef.current = setTimeout(() => {
                window.print();
                
                // Restore original title once focus returns or after fallback duration
                const restoreTitle = () => {
                  document.title = originalTitle;
                  window.removeEventListener('focus', restoreTitle);
                };
                window.addEventListener('focus', restoreTitle);
                setTimeout(restoreTitle, 1000);
              }, 150);
            }}
            className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary/5 transition-colors cursor-pointer"
          >
            طباعة الفاتورة
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer font-semibold uppercase tracking-wider"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-gutter">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 overflow-hidden text-start">
            <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">عناصر الطلب</h3>
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-outline-variant/30 select-none">
                  <th className="pb-4 font-label-md text-label-md text-on-surface-variant text-start">المنتج</th>
                  <th className="pb-4 font-label-md text-label-md text-on-surface-variant text-center">الكمية</th>
                  <th className="pb-4 font-label-md text-label-md text-on-surface-variant text-end">السعر</th>
                  <th className="pb-4 font-label-md text-label-md text-on-surface-variant text-end">المجموع الفرعي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {orderItems.map((item) => {
                  const product = productsById.get(item.product_id);
                  const itemSubtotal = item.unit_price * item.quantity;

                  return (
                    <tr key={item.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-surface border border-outline-variant/30 flex items-center justify-center p-2 overflow-hidden relative shrink-0">
                            {product?.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                                sizes="64px"
                                quality={75}
                                loading="lazy"
                                draggable={false}
                              />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant text-[28px] select-none">inventory_2</span>
                            )}
                          </div>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface font-semibold">
                              {product ? product.name : 'عنصر غير معروف'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center font-body-md text-body-md text-on-surface font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-end font-body-md text-body-md text-on-surface">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-4 text-end font-headline-md text-label-md text-secondary-fixed-dim font-bold">
                        {formatCurrency(itemSubtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pricing calculations */}
            <div className="mt-8 pt-6 border-t border-outline-variant/30 space-y-2 text-sm">
              <div className="flex justify-between font-body-md text-body-md">
                <span className="text-on-surface-variant">المجموع الفرعي</span>
                <span className="text-on-surface font-semibold">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between font-body-md text-body-md">
                <span className="text-on-surface-variant">الشحن (عادي)</span>
                <span className="text-green-600 font-bold text-xs">مجاني</span>
              </div>

              
              <div className="flex justify-between pt-4 font-headline-md text-headline-md border-t border-outline-variant/10 items-end">
                <span className="text-on-surface font-bold text-base">الإجمالي</span>
                <span className="text-secondary-fixed-dim font-montserrat font-bold text-xl">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 text-start">
            <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">ملاحظات المسؤول الداخلية</h3>
            <textarea
              className="w-full bg-surface p-4 border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-on-surface"
              placeholder="أضف ملاحظة خاصة بشأن تنفيذ هذا الطلب..."
              rows={4}
              maxLength={2000}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
            ></textarea>
            <p className="text-on-surface-variant font-label-sm text-label-sm mt-2 select-none">
              هذه الملاحظات مرئية فقط لفريق الإدارة وتُحفظ تلقائياً عند إلغاء التركيز.
            </p>
          </div>
        </div>

        <div className="space-y-gutter text-start">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-4 font-bold border-b border-outline-variant/10 pb-2">
              التحكم في الحالة
            </h3>
            <div className="space-y-4">
              <CustomDropdown
                options={STATUS_OPTIONS}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val as OrderStatus)}
                className="w-full"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-4 font-bold border-b border-outline-variant/10 pb-2">
              معلومات العميل
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-headline-md select-none">
                {getInitials(order.customer_name)}
              </div>
              <div>
                <p className="font-headline-md text-label-md text-on-surface font-bold">{order.customer_name}</p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-1">
                  عنوان الشحن
                </p>
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-line leading-relaxed">
                  {order.shipping_address}
                </p>
              </div>
               <div>
                 <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-1">
                   طريقة الدفع
                 </p>
                 <p className="font-body-md text-body-md text-on-surface font-semibold">
                   {order.payment_method === 'cod' ? 'الدفع عند الاستلام' : order.payment_method === 'instapay' ? 'إنستاباي (InstaPay)' : 'غير محدد'}
                 </p>
               </div>
               <div>
                 <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-1">
                   الهاتف
                 </p>
                 <p className="font-body-md text-body-md text-on-surface">{order.phone_number}</p>
               </div>

              {order.instapay_phone_number && (
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-1">
                    رقم هاتف إنستا باي
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">{order.instapay_phone_number}</p>
                </div>
              )}

              {order.location_link && getSafeUrl(order.location_link) && (
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-1">
                    رابط الموقع
                  </p>
                  <a
                    href={getSafeUrl(order.location_link)!}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="group inline-flex items-center gap-1.5 text-primary font-body-md text-body-md font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span className="group-hover:underline">عرض الموقع الدقيق</span>
                  </a>
                </div>
              )}

              {signedScreenshotUrl && (
                <div className="pt-2 border-t border-outline-variant/20">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider mb-2">
                    إيصال إنستا باي
                  </p>
                  <div className="relative border border-outline-variant/30 rounded-lg overflow-hidden bg-surface-container-low max-h-60 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not optimized */}
                    <img
                      src={signedScreenshotUrl}
                      alt="لقطة شاشة إيصال إنستا باي"
                      className="object-contain w-full h-auto cursor-zoom-in"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onClick={handleOpenScreenshot}
                      title="انقر لعرض الصورة بالحجم الكامل"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-6 font-bold border-b border-outline-variant/10 pb-2 select-none">
              سجل الحالة
            </h3>
            
            {sortedHistory.length > 0 ? (
              <div className="space-y-6 relative before:content-[''] before:absolute before:right-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30 pr-1 text-start max-h-[260px] overflow-y-auto pl-2 scrollbar-thin scrollbar-thumb-outline-variant">
                {sortedHistory.map((h, idx) => {
                  const logDate = formatOrderDate(h.timestamp);
                  const logTime = new Date(h.timestamp).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={h.id} className="relative pr-8">
                      {/* Right Dot node */}
                      <div
                        className={`absolute right-0 top-1.5 w-[16px] h-[16px] rounded-full border-4 border-surface shadow-sm ${
                          idx === 0 ? 'bg-primary' : 'bg-secondary-fixed-dim'
                        }`}
                      ></div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">
                        {translateHistoryStatus(h.status)}
                      </p>
                      <p className="font-body-md text-label-sm text-on-surface-variant mt-0.5">
                        {logDate} - {logTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">لم يتم تسجيل أي تحديثات للحالة بعد.</p>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
          duration={3000}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="تأكيد تحديث الطلب"
        message={`هل أنت متأكد من رغبتك في تحديث حالة الطلب #${order?.id_unique_tracking} إلى "${translateStatus(selectedStatus)}"؟`}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
        confirmLabel="حفظ التغييرات"
        cancelLabel="إلغاء"
      />
      </section>

      <div className="hidden print:block" dir="rtl">
        <style>{`
          @media print {
            @page { margin: 0; }
            html, body {
              margin: 0 !important; padding: 0 !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden { display: none !important; }
          }
        `}</style>

        <div
          style={{
            width: '100%', maxWidth: '210mm',
            margin: '0 auto', padding: '7mm 12mm 8mm',
            fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
            fontSize: '14pt', color: '#222', background: 'white',
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '2px solid #999', paddingBottom: '3mm', marginBottom: '5mm',
          }}>
            <div>
              <div style={{ fontSize: '22pt', fontWeight: 800, color: '#222' }}>
                إلكترو توب
              </div>
              <div style={{ fontSize: '11pt', color: '#666', marginTop: '1mm', lineHeight: 1.6 }}>
                توريدات كهربائية — 21 شارع السبع بنات، المنشية، الإسكندرية<br/>
                <span dir="ltr">{primaryPhone}</span>
                {secondaryPhone && <><br/><span dir="ltr">{secondaryPhone}</span></>}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: '"Courier New", monospace', fontSize: '22pt',
                fontWeight: 900, letterSpacing: '0.5px', color: '#222',
                direction: 'ltr', textAlign: 'left',
              }}>
                {order.id_unique_tracking}
              </div>
              <div style={{ color: '#666', marginTop: '1mm', lineHeight: 1.6, fontSize: '12pt' }}>
                {orderDate} — {orderTime}
              </div>
            </div>
          </div>

          <div className="no-break" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5mm', marginBottom: '5mm',
          }}>
            <div style={{ border: '1.5px solid #ddd', borderRadius: '2mm', padding: '3mm 4mm' }}>
              <div style={{ fontSize: '11pt', fontWeight: 700, color: '#555', marginBottom: '1.5mm' }}>بيانات العميل</div>
              <div style={{ fontSize: '15pt', fontWeight: 600, color: '#222' }}>{order.customer_name}</div>
              <div style={{ fontSize: '13pt', color: '#444', marginTop: '1mm' }}>هاتف: <span dir="ltr">{order.phone_number}</span></div>
              {order.instapay_phone_number && (
                <div style={{ fontSize: '13pt', color: '#444', marginTop: '0.5mm' }}>إنستا باي: <span dir="ltr">{order.instapay_phone_number}</span></div>
              )}
            </div>
            <div style={{ border: '1.5px solid #ddd', borderRadius: '2mm', padding: '3mm 4mm' }}>
              <div style={{ fontSize: '11pt', fontWeight: 700, color: '#555', marginBottom: '1.5mm' }}>عنوان الشحن</div>
              <div style={{ fontSize: '13pt', color: '#222', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {order.shipping_address}
              </div>
              {order.location_link && getSafeUrl(order.location_link) && (
                <div style={{ marginTop: '1.5mm' }}>
                  <a href={getSafeUrl(order.location_link)!}
                    style={{ fontSize: '11pt', color: 'var(--color-status-accepted)', wordBreak: 'break-all', textDecoration: 'underline' }}>
                    {order.location_link}
                  </a>
                </div>
              )}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13pt', marginBottom: '5mm' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: '#333' }}>المنتج</th>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'center', fontWeight: 700, color: '#333', width: '16mm' }}>الكمية</th>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700, color: '#333', width: '24mm' }}>السعر</th>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700, color: '#333', width: '28mm' }}>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => {
                const product = productsById.get(item.product_id);
                const name = product ? product.name : item.product_id;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '2mm 2.5mm', textAlign: 'right', color: '#222' }}>{name}</td>
                    <td style={{ padding: '2mm 2.5mm', textAlign: 'center', color: '#444' }}>{item.quantity}</td>
                    <td style={{ padding: '2mm 2.5mm', textAlign: 'left', color: '#444' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 600, color: '#222' }}>{formatCurrency(item.unit_price * item.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{
            marginTop: '5mm',
            borderTop: '2px solid #999', paddingTop: '3mm',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13pt', color: '#444', padding: '1mm 0' }}>
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13pt', color: '#444', padding: '1mm 0' }}>
              <span>الشحن</span>
              <span style={{ fontWeight: 700 }}>مجاني</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '18pt', fontWeight: 900, color: '#222',
              borderTop: '2px solid #222', paddingTop: '2mm', marginTop: '1mm',
            }}>
              <span>الإجمالي المدفوع</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
             <div style={{ textAlign: 'center', fontSize: '13pt', color: '#666', marginTop: '5mm' }}>
               {order.payment_method === 'cod' 
                 ? 'طريقة الدفع: الدفع عند الاستلام' 
                 : 'تم الدفع عن طريق إنستاباي (InstaPay)'}
             </div>
            <div style={{ textAlign: 'center', fontSize: '11pt', color: '#888', borderTop: '1.5px solid #ddd', marginTop: '3mm', paddingTop: '3mm' }}>
              <div style={{ fontWeight: 600 }}>شكراً لاختياركم إلكترو توب!</div>
              <div>للاستفسارات والدعم: <span dir="ltr">{primaryPhone}</span>{secondaryPhone && <span> / <span dir="ltr">{secondaryPhone}</span></span>}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
