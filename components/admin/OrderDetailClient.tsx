'use client';

import { memo, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { z } from 'zod';
import type { OrderStatus, Order, OrderItem, OrderStatusHistory } from '@/types';
import { formatCurrency, getInitials } from '@/lib/utils/format';
import { formatOrderDate } from '@/lib/utils/date';
import { STATUS_OPTIONS, translateStatus } from '@/lib/utils/status';
import { getSafeUrl, devLog, getSupportEnv, isValidTrackingId } from '@/lib/utils/misc';
import { SAFE_FILENAME_RE } from '@/lib/validations';

import { Toast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PrintableInvoice } from '@/components/admin/PrintableInvoice';
import { OrderItemsCard } from '@/components/admin/OrderItemsCard';
import { StatusHistoryTimeline } from '@/components/admin/StatusHistoryTimeline';


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
  const fetchedIdRef = useRef<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('Pending Review');
  const [notesValue, setNotesValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [signedScreenshotUrl, setSignedScreenshotUrl] = useState<string | null>(null);
  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { phone: phoneNumbers, email: supportEmail } = getSupportEnv();
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

    const isValidFilename = SAFE_FILENAME_RE.test(screenshot);
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

  // Reset local state when id changes
  useEffect(() => {
    setOrder(null);
    setOrderItems([]);
    setStatusHistory([]);
    setLoading(true);
    fetchedIdRef.current = null;
  }, [id]);

  // Load order details from context or database
  useEffect(() => {
    if (fetchedIdRef.current === id) return;

    const fromContext = getOrderById(id);
    const contextItems = getOrderItems(id);
    if (fromContext && contextItems.length > 0) {
      setOrder(fromContext);
      setOrderItems(contextItems);
      setStatusHistory(getStatusHistory(id));
      setLoading(false);
      fetchedIdRef.current = id;
      return;
    }

    const isValidId = isValidTrackingId(id);
    if (!isValidId) {
      setOrder(null);
      setLoading(false);
      fetchedIdRef.current = id;
      return;
    }

    async function loadFromDB() {
      try {
        fetchedIdRef.current = id;
        const { order, items, history } = await fetch(`/api/admin/orders/${id}`).then(r => r.json());
        if (order) {
          setOrder(order);
          setOrderItems(items || []);
          setStatusHistory(history || []);
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
      setSelectedStatus(order.status);
      const notes = order.admin_notes ?? '';
      setNotesValue(notes);
      lastSavedNotes.current = notes;
    }
  }, [order]);

  const sortedHistory = useMemo(() => {
    return [...statusHistory].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [statusHistory]);

  const handleOpenScreenshot = useCallback(async () => {
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

    const isValidFilename = SAFE_FILENAME_RE.test(screenshot);
    if (!isValidFilename) return;

    try {
      const signedUrl = await fetchSignedUrl(screenshot, order?.id_unique_tracking ?? '');
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Error fetching fresh signed URL:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchSignedUrl is a module-level function, stable across renders
  }, [order, fetchSignedUrl]);

  const handleSaveChanges = useCallback(() => {
    if (!order) return;
    setIsConfirmOpen(true);
  }, [order]);

  const handleConfirmSave = useCallback(async () => {
    if (!order) return;
    setIsConfirmOpen(false);
    setIsSaving(true);
    try {
      await updateOrderStatus(order.id_unique_tracking, selectedStatus);
      
      // Update local state variables immediately
      setOrder((prev) => prev ? { ...prev, status: selectedStatus } : null);
      const newHistoryEntry: OrderStatusHistory = {
        id: crypto.randomUUID(),
        order_id: order.id_unique_tracking,
        status: selectedStatus,
        created_at: new Date().toISOString(),
      };
      setStatusHistory((prev) => [newHistoryEntry, ...prev]);

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
  }, [order, selectedStatus, updateOrderStatus]);

  const handleNotesBlur = useCallback(async () => {
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
  }, [order, notesValue, updateAdminNotes]);

  const handleToastClose = useCallback(() => setShowToast(false), []);

  const handleConfirmCancel = useCallback(() => setIsConfirmOpen(false), []);

  const handleStatusChange = useCallback((val: string) => setSelectedStatus(val as OrderStatus), []);

  const handlePrintInvoice = useCallback(() => {
    if (!order) return;
    const originalTitle = document.title;
    document.title = `فاتورة-${order.id_unique_tracking}`;

    if (printTimerRef.current) clearTimeout(printTimerRef.current);
    printTimerRef.current = setTimeout(() => {
      window.print();

      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener('focus', restoreTitle);
      };
      window.addEventListener('focus', restoreTitle);
      setTimeout(restoreTitle, 1000);
    }, 150);
  }, [order]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
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
            <h2 className="text-2xl font-tajawal font-extrabold text-on-surface">لم يتم العثور على الطلب</h2>
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
            onClick={handlePrintInvoice}
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
          <OrderItemsCard
            order={order}
            orderItems={orderItems}
            productsById={productsById}
          />

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6 text-start">
            <h3 className="font-headline-md text-headline-md mb-4 text-on-surface">ملاحظات المسؤول الداخلية</h3>
            <textarea
              className="w-full bg-surface p-4 border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-on-surface"
              placeholder="أضف ملاحظة خاصة بشأن تنفيذ هذا الطلب..."
              rows={4}
              maxLength={MAX_NOTES_LENGTH}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              aria-label="ملاحظات المسؤول"
            ></textarea>
            <div className="flex justify-between items-center mt-2">
              <p className="text-on-surface-variant font-label-sm text-label-sm select-none">
                هذه الملاحظات مرئية فقط لفريق الإدارة وتُحفظ تلقائياً عند إلغاء التركيز.
              </p>
              <span className={`text-xs font-bold tabular-nums select-none ${notesValue.length > MAX_NOTES_LENGTH * 0.9 ? 'text-error' : 'text-on-surface-variant/50'}`}>
                {notesValue.length}/{MAX_NOTES_LENGTH}
              </span>
            </div>
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
                onChange={handleStatusChange}
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

          <StatusHistoryTimeline history={sortedHistory} />
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={handleToastClose}
          duration={3000}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="تأكيد تحديث الطلب"
        message={`هل أنت متأكد من رغبتك في تحديث حالة الطلب #${order?.id_unique_tracking} إلى "${translateStatus(selectedStatus)}"؟`}
        onConfirm={handleConfirmSave}
        onCancel={handleConfirmCancel}
        confirmLabel="حفظ التغييرات"
        cancelLabel="إلغاء"
      />
      </section>

      <PrintableInvoice
        order={order}
        orderItems={orderItems}
        productsById={productsById}
        formatCurrency={formatCurrency}
        orderDate={orderDate}
        orderTime={orderTime}
        primaryPhone={primaryPhone}
        secondaryPhone={secondaryPhone}
        supportEmail={supportEmail}
      />
    </>
  );
});
