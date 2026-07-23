'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getSupportEnv } from '@/lib/utils/misc';

export function Footer() {
  const { whatsapp: whatsappNumbers, phone: phoneNumbers, facebook: facebookUrl, email: supportEmail } = getSupportEnv();

  const uniquePhones = Array.from(new Set(phoneNumbers.filter(Boolean)));
  const uniqueWhatsapp = Array.from(new Set(whatsappNumbers.filter(Boolean)));

  const formatPhoneNumber = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 12 && clean.startsWith('201')) {
      return `0${clean.slice(2)}`;
    }
    if (clean.length === 11 && clean.startsWith('01')) {
      return clean;
    }
    return phone;
  };

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

          {/* Social Links */}
          {facebookUrl && (
            <div className="flex items-center gap-3 pt-1">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="صفحة فيسبوك"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-primary hover:border-primary text-white flex items-center justify-center transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wide border-b border-surface-variant/10 pb-2 w-fit">
            روابط سريعة
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link href="/shop" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="text-primary text-[10px]">◀</span>
                <span>تصفح كافة المنتجات</span>
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="text-primary text-[10px]">◀</span>
                <span>تتبع حالة الطلب</span>
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="text-primary text-[10px]">◀</span>
                <span>مركز الدعم والمساعدة</span>
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="text-primary text-[10px]">◀</span>
                <span>سلة التسوق</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact & Support */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wide border-b border-surface-variant/10 pb-2 w-fit">
            تواصل معنا
          </h4>

          <div className="space-y-3.5 text-xs">
            {/* Phone Call */}
            {uniquePhones.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div>
                  <span className="block text-[11px] text-surface-variant/70 font-semibold mb-0.5">اتصال مباشر</span>
                  <div className="space-y-1">
                    {uniquePhones.map((number, index) => (
                      <a
                        key={index}
                        href={`tel:${number}`}
                        className="text-white hover:text-primary transition-colors font-mono font-bold block"
                      >
                        <bdo dir="ltr">{formatPhoneNumber(number)}</bdo>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {uniqueWhatsapp.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </div>
                <div>
                  <span className="block text-[11px] text-surface-variant/70 font-semibold mb-0.5">واتساب الدعم والمبيعات</span>
                  <div className="space-y-1">
                    {uniqueWhatsapp.map((number, index) => (
                      <a
                        key={index}
                        href={`https://wa.me/${number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-emerald-400 transition-colors font-mono font-bold block"
                      >
                        <bdo dir="ltr">{formatPhoneNumber(number)}</bdo>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            {supportEmail && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div>
                  <span className="block text-[11px] text-surface-variant/70 font-semibold mb-0.5">البريد الإلكتروني</span>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-white hover:text-cyan-300 transition-colors font-mono font-medium block"
                  >
                    <bdo dir="ltr">{supportEmail}</bdo>
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

