'use client';

import React, { memo, useState } from 'react';
import { getSupportEnv } from '@/lib/utils/misc';

export const FloatingContactWidget = memo(function FloatingContactWidget() {
  const { whatsapp } = getSupportEnv();
  const [isOpen, setIsOpen] = useState(false);

  if (!whatsapp || whatsapp.length === 0) return null;

  return (
    <div className="fixed bottom-6 start-6 z-40 font-tajawal dir-rtl">
      {/* Expanded Quick Contact Card */}
      {isOpen && (
        <div className="mb-3.5 bg-white border border-outline-variant/20 rounded-2xl overflow-hidden shadow-2xl w-80 sm:w-84 animate-fade-in-up">
          {/* Header */}
          <div className="bg-[#0B141A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 2c-5.514 0-9.998 4.485-9.998 9.999 0 1.8.47 3.551 1.36 5.097l-1.442 5.271 5.402-1.417c1.493.816 3.178 1.248 4.678 1.248 5.515 0 9.999-4.486 9.999-10s-4.484-9.998-9.999-9.998zm5.952 14.156c-.25.703-1.458 1.342-2.021 1.408-.521.061-1.201.087-3.447-.847-2.871-1.19-4.707-4.137-4.851-4.329-.144-.192-1.164-1.554-1.164-2.96 0-1.407.734-2.1.996-2.388.262-.288.572-.361.764-.361.192 0 .384.001.551.01.177.009.417-.067.653.498.243.583.829 2.023.901 2.168.072.145.12.314.024.505-.096.192-.144.312-.288.48-.144.168-.303.376-.432.505-.144.144-.294.301-.126.589.168.288.747 1.233 1.603 1.996 1.099.979 2.027 1.282 2.315 1.426.288.144.456.12.624-.072.168-.192.72-0.841.912-1.129.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.178 1.399z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-snug">الدعم الفني والمبيعات</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <span className="text-[11px] text-white/70">متاحين الآن للرد الفوري</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-sm w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-surface-container-lowest/50">
            <p className="text-xs text-on-surface-variant mb-3.5 leading-relaxed font-medium">
              أهلاً بك في إلكترو توب! تواصل معنا مباشرة عبر واتساب للاستفسار أو طلبات الكميات:
            </p>

            <div className="space-y-2.5">
              {whatsapp.map((number, idx) => {
                const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent('السلام عليكم، أريد الاستفسار عن المنتجات والمستلزمات الكهربائية في إلكترو توب')}`;
                const label = whatsapp.length > 1 
                  ? (idx === 0 ? 'خط الدعم الأول' : 'خط الدعم الثاني')
                  : 'بدء محادثة واتساب';

                return (
                  <a
                    key={number}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between gap-3 shadow-md hover:shadow-lg transition-all duration-200 group text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 2c-5.514 0-9.998 4.485-9.998 9.999 0 1.8.47 3.551 1.36 5.097l-1.442 5.271 5.402-1.417c1.493.816 3.178 1.248 4.678 1.248 5.515 0 9.999-4.486 9.999-10s-4.484-9.998-9.999-9.998zm5.952 14.156c-.25.703-1.458 1.342-2.021 1.408-.521.061-1.201.087-3.447-.847-2.871-1.19-4.707-4.137-4.851-4.329-.144-.192-1.164-1.554-1.164-2.96 0-1.407.734-2.1.996-2.388.262-.288.572-.361.764-.361.192 0 .384.001.551.01.177.009.417-.067.653.498.243.583.829 2.023.901 2.168.072.145.12.314.024.505-.096.192-.144.312-.288.48-.144.168-.303.376-.432.505-.144.144-.294.301-.126.589.168.288.747 1.233 1.603 1.996 1.099.979 2.027 1.282 2.315 1.426.288.144.456.12.624-.072.168-.192.72-0.841.912-1.129.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.178 1.399z"/>
                        </svg>
                      </div>
                      <span className="font-bold text-[#FFFFFF]">{label}</span>
                    </div>
                    <span className="material-symbols-outlined text-sm rotate-180 group-hover:-translate-x-1 transition-transform">arrow_forward</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-[#25D366] hover:bg-[#20ba5a] text-white w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer focus:outline-none ring-4 ring-[#25D366]/20"
        aria-label="تواصل معنا عبر واتساب"
      >
        <svg className="w-7 h-7 fill-current group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
          <path d="M12.031 2c-5.514 0-9.998 4.485-9.998 9.999 0 1.8.47 3.551 1.36 5.097l-1.442 5.271 5.402-1.417c1.493.816 3.178 1.248 4.678 1.248 5.515 0 9.999-4.486 9.999-10s-4.484-9.998-9.999-9.998zm5.952 14.156c-.25.703-1.458 1.342-2.021 1.408-.521.061-1.201.087-3.447-.847-2.871-1.19-4.707-4.137-4.851-4.329-.144-.192-1.164-1.554-1.164-2.96 0-1.407.734-2.1.996-2.388.262-.288.572-.361.764-.361.192 0 .384.001.551.01.177.009.417-.067.653.498.243.583.829 2.023.901 2.168.072.145.12.314.024.505-.096.192-.144.312-.288.48-.144.168-.303.376-.432.505-.144.144-.294.301-.126.589.168.288.747 1.233 1.603 1.996 1.099.979 2.027 1.282 2.315 1.426.288.144.456.12.624-.072.168-.192.72-0.841.912-1.129.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.178 1.399z"/>
        </svg>
      </button>
    </div>
  );
});

FloatingContactWidget.displayName = 'FloatingContactWidget';
