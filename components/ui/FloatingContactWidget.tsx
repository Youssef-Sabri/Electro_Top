'use client';

import React, { memo, useState } from 'react';
import { getSupportEnv } from '@/lib/utils/misc';

export const FloatingContactWidget = memo(function FloatingContactWidget() {
  const { whatsapp } = getSupportEnv();
  const [isOpen, setIsOpen] = useState(false);

  if (!whatsapp || whatsapp.length === 0) return null;

  return (
    <div className="fixed bottom-6 start-6 z-40 font-tajawal dir-rtl">
      {/* Expanded Quick Contact Menu */}
      {isOpen && (
        <div className="mb-3 bg-white/95 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-4 shadow-2xl w-80 animate-fade-in-up">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
              <span className="font-bold text-xs text-on-surface">الدعم الفني والخدمة</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-on-surface-variant hover:text-on-surface text-xs p-1 rounded-full hover:bg-surface-container-low transition-colors"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          <p className="text-[12px] text-on-surface-variant mb-3 leading-relaxed">
            مرحباً بك! اختر خط الدعم المناسب للتواصل الفوري عبر واتساب:
          </p>

          <div className="space-y-2">
            {whatsapp.map((number, idx) => {
              const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent('السلام عليكم، أريد الاستفسار عن المنتجات والمستلزمات الكهربائية في إلكترو توب')}`;
              const label = whatsapp.length > 1 
                ? `خط الدعم ${idx === 0 ? 'الأول' : 'الثاني'}`
                : 'بدء محادثة واتساب';

              return (
                <a
                  key={number}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-between gap-2 shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 2c-5.514 0-9.998 4.485-9.998 9.999 0 1.8.47 3.551 1.36 5.097l-1.442 5.271 5.402-1.417c1.493.816 3.178 1.248 4.678 1.248 5.515 0 9.999-4.486 9.999-10s-4.484-9.998-9.999-9.998zm5.952 14.156c-.25.703-1.458 1.342-2.021 1.408-.521.061-1.201.087-3.447-.847-2.871-1.19-4.707-4.137-4.851-4.329-.144-.192-1.164-1.554-1.164-2.96 0-1.407.734-2.1.996-2.388.262-.288.572-.361.764-.361.192 0 .384.001.551.01.177.009.417-.067.653.498.243.583.829 2.023.901 2.168.072.145.12.314.024.505-.096.192-.144.312-.288.48-.144.168-.303.376-.432.505-.144.144-.294.301-.126.589.168.288.747 1.233 1.603 1.996 1.099.979 2.027 1.282 2.315 1.426.288.144.456.12.624-.072.168-.192.72-0.841.912-1.129.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.178 1.399z"/>
                    </svg>
                    <span>{label}</span>
                  </div>
                  <span className="material-symbols-outlined text-sm rotate-180 opacity-80">arrow_forward</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
        aria-label="تواصل معنا عبر واتساب"
      >
        <span className="absolute -top-1 -end-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>

        <svg className="w-7 h-7 fill-current group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
          <path d="M12.031 2c-5.514 0-9.998 4.485-9.998 9.999 0 1.8.47 3.551 1.36 5.097l-1.442 5.271 5.402-1.417c1.493.816 3.178 1.248 4.678 1.248 5.515 0 9.999-4.486 9.999-10s-4.484-9.998-9.999-9.998zm5.952 14.156c-.25.703-1.458 1.342-2.021 1.408-.521.061-1.201.087-3.447-.847-2.871-1.19-4.707-4.137-4.851-4.329-.144-.192-1.164-1.554-1.164-2.96 0-1.407.734-2.1.996-2.388.262-.288.572-.361.764-.361.192 0 .384.001.551.01.177.009.417-.067.653.498.243.583.829 2.023.901 2.168.072.145.12.314.024.505-.096.192-.144.312-.288.48-.144.168-.303.376-.432.505-.144.144-.294.301-.126.589.168.288.747 1.233 1.603 1.996 1.099.979 2.027 1.282 2.315 1.426.288.144.456.12.624-.072.168-.192.72-0.841.912-1.129.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.178 1.399z"/>
        </svg>
      </button>
    </div>
  );
});
