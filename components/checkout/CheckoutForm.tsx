'use client';

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { checkoutSchema } from '@/lib/validations';
import type { CheckoutFormData } from '@/lib/validations';
import { formatCurrency } from '@/lib/utils/format';
import { processAndCompressImage } from '@/lib/utils/image';
import { readFileAsDataURL } from '@/lib/utils/file';
import { Toast } from '@/components/ui/Toast';

export function CheckoutForm() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const instapayAccountName = process.env.NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME || '';
  const instapayPhone = process.env.NEXT_PUBLIC_INSTAPAY_PHONE || '';

  const [imageState, setImageState] = useState({
    selectedFile: null as File | null,
    compressedUploadFile: null as File | null,
    isCompressing: false,
    compressionInfo: null as string | null,
  });

  const [uiState, setUiState] = useState({
    isHydrated: false,
    isSubmitting: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const pageLoadTimeRef = useRef<number>(0);

  useEffect(() => {
    pageLoadTimeRef.current = Date.now();
  }, []);

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    phone_number: '',
    shipping_address: '',
    location_link: '',
    payment_method: 'instapay',
    instapay_screenshot: '',
    instapay_phone_number: '',
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors((prev) => ({ ...prev, instapay_screenshot: undefined }));
    setImageState((prev) => ({ ...prev, isCompressing: true, compressionInfo: null }));

    try {
      const { dataUrl, info, compressedFile } = await processAndCompressImage(file);
      setImageState((prev) => ({
        ...prev,
        selectedFile: file,
        compressedUploadFile: compressedFile,
        compressionInfo: info,
        isCompressing: false,
      }));
      setFormData((prev) => ({
        ...prev,
        instapay_screenshot: dataUrl,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'فشل معالجة الصورة. يرجى محاولة رفع ملف آخر.';
      setErrors((prev) => ({
        ...prev,
        instapay_screenshot: errorMsg,
      }));
      setImageState((prev) => ({
        ...prev,
        selectedFile: null,
        compressedUploadFile: null,
        isCompressing: false,
      }));
      e.target.value = '';
    }
  };

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiState((prev) => ({ ...prev, isHydrated: true })); 
  }, []);

  useEffect(() => {
    if (uiState.isHydrated && items.length === 0 && !uiState.isSubmitting) {
      router.replace('/shop');
    }
  }, [uiState.isHydrated, items.length, router, uiState.isSubmitting]);

  if (!uiState.isHydrated || (items.length === 0 && !uiState.isSubmitting)) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center font-tajawal">
        <p className="text-on-surface-variant text-sm">جاري تحميل الدفع...</p>
      </div>
    );
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUiState((prev) => ({ ...prev, isSubmitting: true }));

    if (honeypot) {
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
      return;
    }

    const elapsedMs = Date.now() - pageLoadTimeRef.current;
    if (elapsedMs < 2000) {
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
      return;
    }

    const validationResult = checkoutSchema.safeParse(formData);

    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0] as keyof CheckoutFormData;
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
      return;
    }

    let uploadedFileName: string | undefined;

    try {
      let finalScreenshotUrl = formData.instapay_screenshot;

      if (formData.payment_method === 'instapay') {
        const uploadFile = imageState.compressedUploadFile || imageState.selectedFile;
        if (uploadFile) {
          const dataUrl = await readFileAsDataURL(uploadFile);

          const uploadRes = await fetch('/api/upload/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: dataUrl }),
          });

          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) {
            throw new Error(uploadData.error || 'فشل رفع إيصال التحويل. يرجى المحاولة مرة أخرى.');
          }

          uploadedFileName = uploadData.fileName;
          finalScreenshotUrl = uploadedFileName;
        }
      }

      const orderData = {
        ...validationResult.data,
        instapay_screenshot: finalScreenshotUrl,
        honeypot,
        submission_time: pageLoadTimeRef.current,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, cartItems: items }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.fieldErrors) {
          const firstError = Object.values(result.fieldErrors)[0];
          throw new Error(typeof firstError === 'string' ? firstError : 'بيانات غير صالحة.');
        }
        throw new Error(result.error || 'فشل إنشاء الطلب.');
      }

      const trackingId = result.trackingId;
      try {
        sessionStorage.setItem(`last-order-${trackingId}`, JSON.stringify({
          customer_name: validationResult.data.customer_name,
          phone_number: validationResult.data.phone_number,
          shipping_address: validationResult.data.shipping_address,
          location_link: validationResult.data.location_link || '',
          payment_method: validationResult.data.payment_method,
          instapay_phone_number: validationResult.data.instapay_phone_number || '',
        }));
      } catch {}
      clearCart();
      router.push(`/checkout/confirmation?id=${trackingId}`);
    } catch (err) {
      if (uploadedFileName) {
        fetch(`/api/upload/receipt?filename=${encodeURIComponent(uploadedFileName)}`, { method: 'DELETE' })
          .catch(() => { /* best-effort cleanup */ });
      }
      if (process.env.NODE_ENV !== 'production') console.error('Failed to place order:', err);
      setToastMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 font-tajawal text-on-surface">
      <div aria-hidden="true" className="absolute -left-[9999px] opacity-0 pointer-events-none" style={{ height: 0, overflow: 'hidden' }}>
        <label htmlFor="company_phone">Company Phone</label>
        <input
          id="company_phone"
          name="company_phone"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
          duration={4000}
        />
      )}

      <Link href="/cart" className="group flex items-center gap-2 text-primary font-bold text-sm mb-6 w-fit">
        <span className="material-symbols-outlined select-none rotate-180 text-[18px]">arrow_back</span>
        <span className="group-hover:underline">العودة إلى السلة</span>
      </Link>

      <h1 className="font-bold text-[28px] md:text-[32px] mb-8 text-on-background text-start">
        الدفع الآمن
      </h1>

      {/* Payment Selection Box */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 mb-8 text-start">
        <div className="space-y-6">
          <div>
            <h2 className="text-[17px] font-bold text-on-surface mb-4">اختر طريقة الدفع</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`relative flex items-center gap-3.5 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.payment_method === 'instapay' ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white hover:border-outline-variant/60'}`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="instapay"
                  checked={formData.payment_method === 'instapay'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  {formData.payment_method === 'instapay' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface">إنستاباي (InstaPay)</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">تحويل بنكي فوري</span>
                </div>
              </label>

              <label className={`relative flex items-center gap-3.5 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white hover:border-outline-variant/60'}`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={formData.payment_method === 'cod'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  {formData.payment_method === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface">الدفع عند الاستلام</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">الدفع نقداً عند استلام المنتجات</span>
                </div>
              </label>
            </div>
          </div>

          {formData.payment_method === 'instapay' && (
            <div className="pt-6 border-t border-outline-variant/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px] select-none">account_balance_wallet</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-on-surface mb-2">تعليمات الدفع عبر إنستاباي (InstaPay)</h2>
                  <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                    لإكمال طلبك، يرجى تحويل المبلغ الإجمالي إلى حساب إنستاباي التالي وتحميل صورة إيصال التحويل أدناه:
                  </p>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant max-w-2xl text-start">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider mb-0.5">اسم الحساب في إنستاباي</span>
                      <span className="text-sm font-bold text-on-surface">{instapayAccountName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider mb-0.5">رقم هاتف إنستاباي</span>
                      <span className="text-sm font-bold text-primary">{instapayPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Billing/Shipping Inputs Section */}
        <div className="lg:w-2/3 bg-white border border-outline-variant/20 rounded-2xl p-8 premium-shadow text-start space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-on-surface block font-bold">الاسم الكامل</label>
              <input
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary premium-transition bg-white text-on-background font-medium text-sm ${
                  errors.customer_name ? 'border-error ring-1 ring-error/20' : 'border-outline-variant/50'
                }`}
                name="customer_name"
                placeholder="مثال: محمد علي"
                type="text"
                value={formData.customer_name}
                onChange={handleChange}
                disabled={uiState.isSubmitting}
              />
              {errors.customer_name && (
                <p className="text-xs text-error font-medium">{errors.customer_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-on-surface block font-bold">رقم الهاتف</label>
              <input
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary premium-transition bg-white text-on-background font-medium text-sm text-left ${
                  errors.phone_number ? 'border-error ring-1 ring-error/20' : 'border-outline-variant/50'
                }`}
                name="phone_number"
                placeholder="010 1234 5678"
                type="tel"
                dir="ltr"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={uiState.isSubmitting}
              />
              <p className="text-[10px] text-on-surface-variant font-bold mt-1">
                يفضل أن يكون نشطاً على واتساب للتنسيق مع مندوب الشحن
              </p>
              {errors.phone_number && (
                <p className="text-xs text-error font-medium">{errors.phone_number}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-on-surface block font-bold">عنوان الشحن بالتفصيل</label>
            <input
              className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary premium-transition bg-white text-on-background font-medium text-sm ${
                errors.shipping_address ? 'border-error ring-1 ring-error/20' : 'border-outline-variant/50'
              }`}
              name="shipping_address"
              placeholder="مثال: 12 شارع جمال عبد الناصر، سيدي بشر، الإسكندرية"
              type="text"
              value={formData.shipping_address}
              onChange={handleChange}
              disabled={uiState.isSubmitting}
            />
            {errors.shipping_address && (
              <p className="text-xs text-error font-medium">{errors.shipping_address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`space-y-2 ${formData.payment_method === 'cod' ? 'md:col-span-2' : ''}`}>
              <label className="text-sm text-on-surface block font-bold">
                رابط الموقع الجغرافي <span className="text-on-surface-variant font-semibold text-xs">(اختياري - رابط جوجل ماب)</span>
              </label>
              <input
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary premium-transition bg-white text-on-background font-medium text-sm border-outline-variant/50 text-left"
                name="location_link"
                placeholder="https://maps.app.goo.gl/xyz"
                type="text"
                dir="ltr"
                value={formData.location_link || ''}
                onChange={handleChange}
                disabled={uiState.isSubmitting}
              />
            </div>

            {formData.payment_method === 'instapay' && (
              <div className="space-y-2">
                <label className="text-sm text-on-surface block font-bold">
                  رقم الهاتف المحول منه إنستاباي <span className="text-on-surface-variant font-semibold text-xs">(اختياري)</span>
                </label>
                <input
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary premium-transition bg-white text-on-background font-medium text-sm border-outline-variant/50 text-left"
                  name="instapay_phone_number"
                  placeholder="010 1122 3344"
                  type="tel"
                  dir="ltr"
                  value={formData.instapay_phone_number || ''}
                  onChange={handleChange}
                  disabled={uiState.isSubmitting}
                />
                <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                  ⓘ املأ فقط إذا كان رقم هاتف محول مختلفاً عن رقم الاتصال.
                </p>
              </div>
            )}
          </div>

          {formData.payment_method === 'instapay' && (
            <div className="space-y-2 pt-2">
              <label className="text-sm text-on-surface block font-bold">
                لقطة شاشة تحويل إنستاباي <span className="text-error font-bold">*</span>{' '}
                <span className="text-on-surface-variant font-medium text-xs">(إيصال التحويل - الحد الأقصى 5 ميجابايت، يضغط تلقائياً)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uiState.isSubmitting || imageState.isCompressing}
                  className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container file:text-primary hover:file:bg-surface-container-high cursor-pointer disabled:opacity-60"
                />
                {imageState.isCompressing && (
                  <span className="text-xs text-primary font-bold flex items-center gap-1 shrink-0 animate-pulse">
                    <span className="material-symbols-outlined text-base select-none">compress</span>
                    جاري الضغط...
                  </span>
                )}
                {!imageState.isCompressing && formData.instapay_screenshot && (
                  <div className="relative w-12 h-12 rounded-xl border border-outline-variant overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.instapay_screenshot}
                      alt="معاينة إيصال إنستاباي"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
              {imageState.compressionInfo && !errors.instapay_screenshot && (
                <p className="text-[10px] text-[var(--color-status-delivered)] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                  {imageState.compressionInfo}
                </p>
              )}
              {errors.instapay_screenshot && (
                <p className="text-xs text-error font-medium">{errors.instapay_screenshot}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Final Order Review Panel (Warm dark theme) */}
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
                    <p className="text-on-surface-variant text-[11px] mt-0.5">الكمية: {item.quantity}</p>
                    {item.selectedColor && (
                      <p className="text-on-surface-variant text-[10px]">اللون: {item.selectedColor}</p>
                    )}
                  </div>
                  <p className="font-bold text-xs shrink-0">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-8 pt-4 border-t border-surface-variant/10">
              <div className="flex justify-between text-xs text-surface-variant/80">
                <span>المجموع الفرعي</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div className="flex justify-between text-xs text-electro-gold">
                <span className="font-bold">المبلغ الإجمالي المطلوب</span>
                <span className="text-[26px] font-bold gold-glow leading-none font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uiState.isSubmitting}
              className="w-full bg-[#CA202B] hover:bg-[#b01b24] text-white py-4 rounded-xl font-bold hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {uiState.isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin select-none text-[18px]">sync</span>
                  جاري إرسال الطلب...
                </>
              ) : (
                'تأكيد الطلب الآن'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
