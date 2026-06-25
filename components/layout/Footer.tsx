
import { memo } from 'react';
import { getSupportEnv } from '@/lib/env-utils';

export const Footer = memo(function Footer() {
  const { whatsapp: whatsappNumber, facebook: facebookUrl, phone: phoneNumber } = getSupportEnv();

  return (
    <footer className="bg-on-background text-secondary-fixed w-full">
      <div className="max-w-max-width mx-auto px-margin-desktop py-20 flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Brand Column */}
        <div className="space-y-6 max-w-2xl text-start">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1.5 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
               <img
                 alt="شعار إلكترو توب"
                 className="h-8 w-auto"
                 src="/logo.png"
                 width="32"
                 height="32"
                 style={{ width: 'auto' }}
                 loading="lazy"
               />
            </div>
            <span className="font-headline-md text-headline-md text-secondary-fixed font-extrabold tracking-tighter">
              إلكترو توب
            </span>
          </div>
          <p className="font-body-md text-surface-variant/80 max-w-xl">
            مصدرك الأول للمستلزمات الكهربائية المتطورة في الإسكندرية، مصر. موزع معتمد للحلول الصناعية والتجارية والسكنية.
          </p>
          <div className="flex gap-4">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-surface-variant/10 flex items-center justify-center hover:bg-primary transition-colors text-surface-variant hover:text-white"
              aria-label="تابعنا على فيسبوك"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Support Column */}
        <div className="space-y-4 text-start md:text-end min-w-[200px]">
          <h4 className="text-secondary-fixed font-bold text-xs uppercase tracking-widest">
            الاتصال والدعم
          </h4>
          <div className="flex flex-col gap-3">
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center md:justify-end gap-2 text-surface-variant hover:text-secondary-fixed transition-colors font-medium text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">phone</span>
              <span dir="ltr">{phoneNumber}</span>
            </a>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center md:justify-end gap-2 text-surface-variant hover:text-secondary-fixed transition-colors font-medium text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>مراسلتنا عبر واتساب</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-max-width mx-auto px-margin-desktop py-8 border-t border-surface-variant/10 text-center text-surface-variant/60 text-label-sm">
        <span>© 2026 إلكترو توب. جميع الحقوق محفوظة.</span>
      </div>
    </footer>
  );
});
