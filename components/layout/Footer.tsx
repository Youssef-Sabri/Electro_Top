import Image from 'next/image';
import { getSupportEnv } from '@/lib/utils/misc';

export function Footer() {
  const { whatsapp: whatsappNumbers, phone: phoneNumbers, facebook: facebookUrl, email: supportEmail } = getSupportEnv();

  return (
    <footer className="bg-on-background text-secondary-fixed w-full border-t border-surface-variant/10 font-tajawal">
      {/* Upper Grid Area */}
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-2 gap-12 text-start">
        
        {/* Column 1: Brand Info */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1.5 shadow-sm">
               <Image
                alt="شعار إلكترو توب"
                className="h-8 w-auto"
                src="/logo.png"
                width={32}
                height={32}
                style={{ width: 'auto' }}
              />
            </div>
            <span className="font-headline-md text-headline-md text-secondary-fixed font-extrabold tracking-tighter">
              إلكترو توب
            </span>
          </div>
          <p className="text-sm text-surface-variant/80 leading-relaxed max-w-sm">
            شريكك الموثوق في الحلول الكهربائية. نوفر مستلزمات كهربائية أصلية من أفضل العلامات التجارية العالمية، بأسعار تنافسية، واستشارات فنية، وتوصيل سريع للمشروعات السكنية والتجارية والصناعية.
          </p>
          <div className="flex gap-3 pt-2">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-surface-variant/10 flex items-center justify-center hover:bg-primary transition-all duration-[250ms] text-surface-variant hover:text-white"
              aria-label="تابعنا على فيسبوك"
            >
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Contact & Support */}
        <div className="space-y-5">
          <h4 className="text-secondary-fixed font-bold text-sm tracking-wide border-b border-surface-variant/10 pb-2 w-fit">
            الاتصال والدعم
          </h4>
          <div className="flex flex-col gap-4 text-sm">
            {/* Phone numbers row */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[18px]">phone</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] text-surface-variant/50 font-bold uppercase tracking-wider">اتصل بنا</span>
                <div className="flex flex-col gap-0.5">
                  {phoneNumbers.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number}`}
                      className="text-surface-variant hover:text-secondary-fixed transition-colors font-mono font-medium block"
                      dir="ltr"
                    >
                      {number}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp numbers row */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center text-[#25D366] shrink-0">
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] text-surface-variant/50 font-bold uppercase tracking-wider">مراسلتنا واتساب</span>
                <div className="flex flex-col gap-0.5">
                  {whatsappNumbers.map((number, index) => (
                    <a
                      key={index}
                      href={`https://wa.me/${number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-surface-variant hover:text-secondary-fixed transition-colors font-medium block"
                    >
                      مراسلة الدعم {whatsappNumbers.length > 1 && `(${index + 1})`}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Email address row */}
            {supportEmail && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-400/15 flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] text-surface-variant/50 font-bold uppercase tracking-wider">البريد الإلكتروني</span>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-surface-variant hover:text-secondary-fixed transition-colors font-mono font-medium block"
                    dir="ltr"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-surface-variant/10 py-6 text-center text-xs text-surface-variant/60 max-w-max-width mx-auto px-margin-desktop">
        <span>© 2026 إلكترو توب. جميع الحقوق محفوظة.</span>
      </div>
    </footer>
  );
}
