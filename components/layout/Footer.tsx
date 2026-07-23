'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getSupportEnv } from '@/lib/utils/misc';

export function Footer() {
  const { whatsapp: whatsappNumbers, phone: phoneNumbers, facebook: facebookUrl, email: supportEmail } = getSupportEnv();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-on-background text-surface-variant w-full border-t border-surface-variant/10 font-tajawal relative">
      {/* Main Grid Area */}

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-3 gap-10 text-start">
        
        {/* Column 1: Brand Info */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1.5 shadow-md relative w-9 h-9 flex items-center justify-center">
              <Image
                alt="شعار إلكترو توب"
                src="/logo.png"
                width={32}
                height={32}
                className="object-contain mix-blend-multiply"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-white font-extrabold tracking-tighter">
                إلكترو توب
              </span>
              <span className="text-[10px] text-electro-gold font-bold tracking-widest">ELECTRO TOP</span>
            </div>
          </div>
          <p className="text-xs text-surface-variant/80 leading-relaxed">
            شريكك الموثوق في الحلول الكهربائية. نوفر مستلزمات أسلاك، كابلات، قواطع حماية، ولوحات توزيع أصلية معتمدة بأفضل الأسعار والتوصيل لجميع المحافظات.
          </p>
          <div className="flex gap-3 pt-2">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-surface-variant/10 flex items-center justify-center hover:bg-primary transition-all duration-200 text-surface-variant hover:text-white"
              aria-label="تابعنا على فيسبوك"
            >
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wide border-b border-surface-variant/10 pb-2 w-fit">
            روابط سريعة
          </h4>
          <ul className="space-y-2.5 text-xs text-surface-variant/80">
            <li>
              <Link href="/" className="hover:text-electro-gold transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-primary">chevron_left</span>
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-electro-gold transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-primary">chevron_left</span>
                جميع المنتجات والمتجر
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-electro-gold transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-primary">chevron_left</span>
                تتبع حالة الطلب
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-electro-gold transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-primary">chevron_left</span>
                مركز الدعم والأسئلة الشائعة
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-electro-gold transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-primary">chevron_left</span>
                سلة التسوق
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact & Support */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wide border-b border-surface-variant/10 pb-2 w-fit">
            تواصل معنا
          </h4>

          <div className="flex flex-col gap-3 text-xs">
            {/* Phone numbers row */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[16px]">phone</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] text-surface-variant/60 font-bold uppercase">الهاتف Direct Call</span>
                <div className="flex flex-col gap-0.5">
                  {phoneNumbers.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number}`}
                      className="text-surface-variant hover:text-white transition-colors font-mono font-medium block"
                      dir="ltr"
                    >
                      {number}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp numbers row */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 flex items-center justify-center text-[#25D366] shrink-0">
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] text-surface-variant/60 font-bold uppercase">خدمة العملاء WhatsApp</span>
                <div className="flex flex-col gap-0.5">
                  {whatsappNumbers.map((number, index) => (
                    <a
                      key={index}
                      href={`https://wa.me/${number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-surface-variant hover:text-white transition-colors font-medium block"
                    >
                      تواصل عبر واتساب {whatsappNumbers.length > 1 && `(${index + 1})`}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Email address row */}
            {supportEmail && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-400/15 flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] text-surface-variant/60 font-bold uppercase">البريد الإلكتروني</span>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-surface-variant hover:text-white transition-colors font-mono font-medium block"
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

      {/* Bottom Copyright & Payment Methods Bar */}
      <div className="border-t border-surface-variant/10 py-6 bg-black/30 text-xs text-surface-variant/60">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-start">
          <span>© {new Date().getFullYear()} إلكترو توب — جميع الحقوق محفوظة | تكنولوجيا وتوزيع مستلزمات الكهرباء</span>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/50">طرق الدفع المتاحة:</span>
            <div className="flex items-center gap-2">
              <span className="bg-white/10 text-white font-bold text-[10px] px-2 py-0.5 rounded border border-white/10">
                InstaPay
              </span>
              <span className="bg-white/10 text-white font-bold text-[10px] px-2 py-0.5 rounded border border-white/10">
                الدفع عند الاستلام (COD)
              </span>
            </div>
            
            <button
              onClick={scrollToTop}
              className="bg-primary/20 hover:bg-primary text-primary hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all ms-2"
              aria-label="العودة لأعلى الصفحة"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

