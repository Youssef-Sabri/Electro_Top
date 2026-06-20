'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { checkoutSchema } from '@/lib/validators';
import type { CheckoutFormData } from '@/lib/validators';
import { formatCurrency } from '@/lib/format-currency';
import { processAndCompressImage } from '@/lib/image-utils';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/components/ui/Toast';

export function CheckoutForm() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { createOrder } = useOrders();

  const instapayAccountName = process.env.NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME || '';
  const instapayPhone = process.env.NEXT_PUBLIC_INSTAPAY_PHONE || '';

  // Batch image upload state (image files + compression feedback)
  const [imageState, setImageState] = useState({
    selectedFile: null as File | null,
    compressedUploadFile: null as File | null,
    isCompressing: false,
    compressionInfo: null as string | null,
  });

  // Batch UI state (hydration + submission)
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
    instapay_screenshot: '',
    instapay_phone_number: '',
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const errorMsg = err instanceof Error ? err.message : 'ÙØ´Ù„ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„ØµÙˆØ±Ø©. ÙŠØ±Ø¬Ù‰ Ù…Ø­Ø§ÙˆÙ„Ø© Ø±ÙØ¹ Ù…Ù„Ù Ø¢Ø®Ø±.';
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setUiState((prev) => ({ ...prev, isHydrated: true })); }, []);

  useEffect(() => {
    if (uiState.isHydrated && items.length === 0 && !uiState.isSubmitting) {
      router.replace('/');
    }
  }, [uiState.isHydrated, items.length, router, uiState.isSubmitting]);

  if (!uiState.isHydrated || (items.length === 0 && !uiState.isSubmitting)) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center font-poppins">
        <p className="text-on-surface-variant text-sm">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¯ÙØ¹...</p>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUiState((prev) => ({ ...prev, isSubmitting: true }));

    // Honeypot check â€” if a bot filled the hidden field, silently ignore the submission
    if (honeypot) {
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
      return;
    }

    // Time-based bot detection â€” reject submissions < 2 seconds after page load
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

    try {
      let finalScreenshotUrl = formData.instapay_screenshot;

      // 1. Upload receipt file if present to storage first
      const uploadFile = imageState.compressedUploadFile || imageState.selectedFile;
      if (uploadFile) {
        const mime = uploadFile.type || imageState.selectedFile?.type || 'image/jpeg';
        
        // Restrict upload to standard whitelisted image formats (prevents HTML/SVG injection)
        const whitelistedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
        if (!whitelistedMimes.includes(mime)) {
          throw new Error('Ù†ÙˆØ¹ Ø§Ù„Ù…Ù„Ù ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…. ÙŠØ±Ø¬Ù‰ Ø±ÙØ¹ ØµÙˆØ±Ø© ØµØ§Ù„Ø­Ø© (JPG, PNG, WEBP, GIF, HEIC).');
        }

        const ext = mime.split('/')[1] || 'jpg';
        const random = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(36).charAt(0)).join('');
        const fileName = `receipt-${random}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('instapay-receipts')
          .upload(fileName, uploadFile, { contentType: mime, metadata: { mimetype: mime } });

        if (uploadError) {
          if (process.env.NODE_ENV !== 'production') console.error('Receipt upload failed:', uploadError.message);
          throw new Error('ÙØ´Ù„ Ø±ÙØ¹ Ø¥ÙŠØµØ§Ù„ Ø§Ù„ØªØ­ÙˆÙŠÙ„. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
        }

        // Store filename only â€” URL is never exposed publicly. Admin pages
        // generate time-limited signed URLs via createSignedUrl() at render time.
        finalScreenshotUrl = fileName;
      }

      // 2. Create order in context
      const orderData = {
        ...validationResult.data,
        instapay_screenshot: finalScreenshotUrl,
      };

      const newOrder = await createOrder(orderData, items);
      
      // 3. Clear the cart
      clearCart();
      
      // 4. Redirect to order confirmation page
      router.push(`/checkout/confirmation?id=${newOrder.id_unique_tracking}`);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to place order:', err);
      setToastMessage(err instanceof Error ? err.message : 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨Ùƒ. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop font-poppins">
      {/* Honeypot field for bot prevention â€” positioned off-screen to avoid modern bots detecting display:none */}
      <div aria-hidden="true" className="absolute -left-[9999px] opacity-0 pointer-events-none" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
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

      <Link href="/cart" className="group flex items-center gap-2 text-primary font-label-md mb-6 w-fit">
        <span className="material-symbols-outlined select-none rotate-180">arrow_back</span>
        <span className="group-hover:underline">Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø³Ù„Ø©</span>
      </Link>

      <h1 className="font-headline-lg text-headline-lg mb-8 text-on-background text-start">
        Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¢Ù…Ù†
      </h1>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 text-start">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px] select-none">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-body-lg font-bold text-on-surface mb-2">ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ (InstaPay)</h2>
            <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
              Ø¥ÙƒÙ…Ø§Ù„ Ø·Ù„Ø¨ÙƒØŒ ÙŠØ±Ø¬Ù‰ ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø¥Ù„Ù‰ Ø­Ø³Ø§Ø¨ Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ Ø§Ù„ØªØ§Ù„ÙŠ ÙˆØªØ­Ù…ÙŠÙ„ ØµÙˆØ±Ø© Ø¥ÙŠØµØ§Ù„ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø£Ø¯Ù†Ø§Ù‡:
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 bg-white p-4 rounded-lg border border-outline-variant/40 max-w-2xl text-start">
              <div>
                <span className="text-xs text-on-surface-variant block uppercase font-bold tracking-wider">Ø§Ø³Ù… Ø§Ù„Ø­Ø³Ø§Ø¨ ÙÙŠ Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ</span>
                <span className="text-body-md font-bold text-on-surface">{instapayAccountName}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block uppercase font-bold tracking-wider">Ø±Ù‚Ù… Ù‡Ø§ØªÙ Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ</span>
                <span className="text-body-md font-bold text-primary flex items-center gap-1.5">
                  {instapayPhone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-gutter">
        <div className="lg:w-2/3 bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-start space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label-md text-on-surface block font-bold">Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„</label>
              <input
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                  errors.customer_name ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
                }`}
                name="customer_name"
                placeholder="Ù…Ø«Ø§Ù„: Ù…Ø­Ù…Ø¯ Ø¹Ù„ÙŠ"
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
              <label className="font-label-md text-on-surface block font-bold">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</label>
              <input
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md text-left ${
                  errors.phone_number ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
                }`}
                name="phone_number"
                placeholder="010 1234 5678"
                type="tel"
                dir="ltr"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={uiState.isSubmitting}
              />
              <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                ÙŠÙØ¶Ù„ Ø£Ù† ÙŠÙƒÙˆÙ† Ù†Ø´Ø·Ø§Ù‹ Ø¹Ù„Ù‰ ÙˆØ§ØªØ³Ø§Ø¨
              </p>
              {errors.phone_number && (
                <p className="text-xs text-error font-medium">{errors.phone_number}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-md text-on-surface block font-bold">Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø´Ø­Ù† Ø¨Ø§Ù„ØªÙØµÙŠÙ„</label>
            <input
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                errors.shipping_address ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
              }`}
              name="shipping_address"
              placeholder="Ù…Ø«Ø§Ù„: 12 Ø´Ø§Ø±Ø¹ Ø¬Ù…Ø§Ù„ Ø¹Ø¨Ø¯ Ø§Ù„Ù†Ø§ØµØ±ØŒ Ø³ÙŠØ¯ÙŠ Ø¨Ø´Ø±ØŒ Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©"
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
            <div className="space-y-2">
              <label className="font-label-md text-on-surface block font-bold">
                Ø±Ø§Ø¨Ø· Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠ <span className="text-on-surface-variant font-normal text-xs">(Ø§Ø®ØªÙŠØ§Ø±ÙŠ - Ø±Ø§Ø¨Ø· Ø¬ÙˆØ¬Ù„ Ù…Ø§Ø¨)</span>
              </label>
              <input
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md border-gray-300 text-left"
                name="location_link"
                placeholder="https://maps.app.goo.gl/xyz"
                type="text"
                dir="ltr"
                value={formData.location_link || ''}
                onChange={handleChange}
                disabled={uiState.isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-on-surface block font-bold">
                Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ù…Ø­ÙˆÙ„ Ù…Ù†Ù‡ Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ <span className="text-on-surface-variant font-normal text-xs">(Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</span>
              </label>
              <input
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md border-gray-300 text-left"
                name="instapay_phone_number"
                placeholder="010 1122 3344"
                type="tel"
                dir="ltr"
                value={formData.instapay_phone_number || ''}
                onChange={handleChange}
                disabled={uiState.isSubmitting}
              />
              <p className="text-[11px] text-on-surface-variant font-medium mt-1 leading-relaxed">
                â“˜ Ø§Ù…Ù„Ø£ Ù‡Ø°Ø§ Ø§Ù„Ø­Ù‚Ù„ ÙÙ‚Ø· Ø¥Ø°Ø§ ÙƒØ§Ù† Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ø°ÙŠ Ù‚Ù…Øª Ø¨Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ù…Ù†Ù‡ Ù…Ø®ØªÙ„ÙØ§Ù‹ Ø¹Ù† Ø±Ù‚Ù… Ø§Ù„Ø§ØªØµØ§Ù„ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-md text-on-surface block font-bold">
              Ù„Ù‚Ø·Ø© Ø´Ø§Ø´Ø© ØªØ­ÙˆÙŠÙ„ Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ <span className="text-red-500 font-bold">*</span>{' '}
              <span className="text-on-surface-variant font-normal text-xs">(Ø¥ÙŠØµØ§Ù„ Ø§Ù„ØªØ­ÙˆÙŠÙ„ - Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØªØŒ ÙˆÙŠØªÙ… Ø¶ØºØ·Ù‡ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uiState.isSubmitting || imageState.isCompressing}
                className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container-low file:text-primary hover:file:bg-surface-container-medium cursor-pointer disabled:opacity-60"
              />
              {imageState.isCompressing && (
                <span className="text-xs text-primary font-medium flex items-center gap-1 shrink-0 animate-pulse">
                  <span className="material-symbols-outlined text-base select-none">compress</span>
                  Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¶ØºØ·...
                </span>
              )}
               {!imageState.isCompressing && formData.instapay_screenshot && (
                 <div className="relative w-12 h-12 rounded border border-outline-variant/30 overflow-hidden bg-surface-container-low shrink-0">
                   {/* eslint-disable-next-line @next/next/no-img-element -- data-URI preview */}
                   <img
                     src={formData.instapay_screenshot}
                     alt="Ù…Ø¹Ø§ÙŠÙ†Ø© Ø¥ÙŠØµØ§Ù„ Ø¥Ù†Ø³ØªØ§Ø¨Ø§ÙŠ"
                     className="object-cover w-full h-full"
                   />
                 </div>
               )}
             </div>
             {imageState.compressionInfo && !errors.instapay_screenshot && (
               <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                 <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                 {imageState.compressionInfo}
               </p>
             )}
            {errors.instapay_screenshot && (
              <p className="text-xs text-error font-medium">{errors.instapay_screenshot}</p>
            )}
          </div>
        </div>{/* end lg:w-2/3 left panel */}

        <div className="lg:w-1/3">
          <div className="bg-on-background text-white rounded-xl p-8 shadow-xl sticky top-24 text-start">
            <h2 className="font-headline-md text-headline-md mb-6 text-surface-bright pb-4 border-b border-surface-variant/20">
              Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ©
            </h2>
            
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pe-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded border border-white/20 relative overflow-hidden bg-white shrink-0">
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
                    <p className="font-label-md truncate text-white">{item.product.name}</p>
                    <p className="text-surface-variant/70 text-[12px]">Ø§Ù„ÙƒÙ…ÙŠØ©: {item.quantity}</p>
                  </div>
                  <p className="font-bold shrink-0">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-8 pt-4 border-t border-surface-variant/20">
              <div className="flex justify-between font-label-md text-surface-variant">
                <span>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div className="flex justify-between font-label-md text-secondary-fixed">
                <span className="font-bold">Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨</span>
                <span className="text-[28px] font-display-lg gold-glow font-mono">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uiState.isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-lg font-headline-md text-body-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {uiState.isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin select-none">sync</span>
                  Ø¬Ø§Ø±ÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨...
                </>
              ) : (
                'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø¢Ù†'
              )}
            </button>


          </div>
        </div>
      </div>
    </form>
  );
}
