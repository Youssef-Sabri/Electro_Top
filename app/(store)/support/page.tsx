import { Metadata } from 'next';
import { getSupportEnv } from '@/lib/utils/misc';

export const metadata: Metadata = {
  title: 'الاتصال والدعم | إلكترو توب',
  description: 'تواصل مع فريق الدعم للاستفسارات والمساعدة.',
  alternates: {
    canonical: '/support',
  },
};

export default function SupportPage() {
  const { whatsapp: whatsappNumbers, phone: phoneNumbers, facebook: facebookUrl, email: supportEmail } = getSupportEnv();

  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      {/* Premium Dark Header */}
      <div className="bg-on-background py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="material-symbols-outlined text-[56px] text-primary mb-3 select-none">
            support_agent
          </span>
          <h1 className="font-bold text-[32px] md:text-[38px] text-white tracking-tight mb-2">
            الاتصال والدعم
          </h1>
          <p className="text-surface-variant/80 text-sm max-w-xl mx-auto leading-relaxed">
            هل تحتاج إلى مساعدة في طلبك أو لديك أي استفسار؟ تواصل مع فريقنا مباشرة عبر القنوات المتاحة.
          </p>
        </div>
      </div>

      {/* Support Layout Container */}
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* FAQ Accordion Section (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-primary">quiz</span>
              الأسئلة الشائعة
            </h2>
            
            <div className="space-y-4">
              <details className="group border border-outline-variant/30 rounded-2xl bg-surface-container-lowest p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between focus:outline-none list-none">
                  <span className="font-bold text-base text-on-surface group-open:text-primary transition-colors">
                    كيف يمكنني تتبع حالة طلبي؟
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform duration-300">
                    expand_more
                  </span>
                </summary>
                <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                  يمكنك تتبع طلبك بسهولة عن طريق الانتقال إلى صفحة &quot;تتبع الطلب&quot; في القائمة العلوية، وإدخال رقم التتبع الفريد الخاص بك (الذي يظهر بعد إتمام الطلب مباشرة).
                </p>
              </details>

              <details className="group border border-outline-variant/30 rounded-2xl bg-surface-container-lowest p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between focus:outline-none list-none">
                  <span className="font-bold text-base text-on-surface group-open:text-primary transition-colors">
                    ما هي طرق الدفع المتاحة؟
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform duration-300">
                    expand_more
                  </span>
                </summary>
                <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                  نوفر طريقتين للدفع: الدفع عند الاستلام (COD) لتسهيل الشراء، أو التحويل الفوري عبر تطبيق إنستا باي (InstaPay) مباشرة أثناء تأكيد الطلب.
                </p>
              </details>

              <details className="group border border-outline-variant/30 rounded-2xl bg-surface-container-lowest p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between focus:outline-none list-none">
                  <span className="font-bold text-base text-on-surface group-open:text-primary transition-colors">
                    كيف أقوم بتأكيد التحويل عبر إنستا باي؟
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform duration-300">
                    expand_more
                  </span>
                </summary>
                <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                  بعد إرسال المبلغ إلى حساب إنستاباي الموضح في صفحة الدفع، يرجى رفع لقطة شاشة (Screenshot) لإيصال التحويل في الحقل المخصص بصفحة إتمام الطلب ليتم مراجعة طلبك وتأكيده بسرعة.
                </p>
              </details>

              <details className="group border border-outline-variant/30 rounded-2xl bg-surface-container-lowest p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between focus:outline-none list-none">
                  <span className="font-bold text-base text-on-surface group-open:text-primary transition-colors">
                    هل جميع المنتجات المعروضة أصلية؟
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform duration-300">
                    expand_more
                  </span>
                </summary>
                <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
                  نعم، جميع المنتجات المعروضة في إلكترو توب أصلية 100%؛ حيث نعمل كموزعين معتمدين لأشهر العلامات التجارية مثل السويدي إلكتريك، ميتسوبيشي، هيمل، ABB، وفينوس، لضمان أعلى مستويات الجودة والأمان.
                </p>
              </details>
            </div>
          </div>

          {/* Quick Support Channels (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-primary">contact_support</span>
              قنوات الاتصال المباشر
            </h2>
            
            <div className="space-y-4">
              {/* WhatsApp Row */}
              <div className="bg-white border border-outline-variant/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.452 5.428 0 9.845-4.415 9.848-9.848.002-2.63-1.02-5.1-2.877-6.958-1.857-1.859-4.329-2.88-6.963-2.882-5.435 0-9.85 4.417-9.853 9.851-.001 1.768.463 3.493 1.344 5.011l-.982 3.585 3.666-.961zm11.233-7.042c-.295-.148-1.748-.862-2.016-.96-.268-.098-.463-.148-.658.148-.195.295-.756.96-.927 1.157-.17.196-.341.22-.636.073-.295-.148-1.246-.459-2.375-1.464-.877-.783-1.47-1.75-1.642-2.046-.172-.295-.018-.455.13-.602.133-.132.296-.345.443-.518.148-.173.196-.296.296-.494.098-.198.049-.37-.025-.518-.073-.148-.658-1.586-.902-2.179-.237-.57-.497-.493-.68-.502-.17-.008-.365-.01-.56-.01-.195 0-.512.073-.78.365-.268.293-1.024 1.002-1.024 2.443 0 1.442 1.049 2.839 1.195 3.037.147.197 2.064 3.153 5.001 4.426.699.303 1.244.484 1.67.62.704.224 1.345.193 1.851.118.563-.083 1.748-.714 1.992-1.403.243-.689.243-1.278.17-1.402-.073-.125-.268-.198-.563-.346z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">واتساب</h3>
                    <p className="text-[11px] text-on-surface-variant font-medium">الرد سريع وخلال دقائق</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5 shrink-0 w-full sm:w-auto justify-start sm:justify-center">
                  {whatsappNumbers.map((number, index) => (
                    <a
                      key={index}
                      href={`https://wa.me/${number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white w-28 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>واتساب {whatsappNumbers.length > 1 && `(${index + 1})`}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Call Row */}
              <div className="bg-white border border-outline-variant/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">phone_in_talk</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">اتصال هاتفي</h3>
                    <p className="text-[11px] text-on-surface-variant font-medium">متاح خلال ساعات العمل الرسمية</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5 shrink-0 w-full sm:w-auto justify-start sm:justify-center">
                  {phoneNumbers.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number}`}
                      className="bg-primary hover:bg-primary/95 active:scale-[0.97] text-white w-28 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">phone</span>
                      <span>اتصال {phoneNumbers.length > 1 && `(${index + 1})`}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Email Row */}
              {supportEmail && (
                <div className="bg-white border border-outline-variant/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">mail</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">البريد الإلكتروني</h3>
                      <p className="text-[10px] text-on-surface-variant font-mono">{supportEmail}</p>
                    </div>
                  </div>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="bg-cyan-600 hover:bg-cyan-700 active:scale-[0.97] text-white w-28 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-xs shrink-0 self-start sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[15px]">mail</span>
                    <span>مراسلة</span>
                  </a>
                </div>
              )}

              {/* Facebook Row */}
              <div className="bg-white border border-outline-variant/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">صفحة فيسبوك</h3>
                    <p className="text-[11px] text-on-surface-variant font-medium">تابع آخر الأخبار والمنتجات</p>
                  </div>
                </div>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white w-28 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-xs shrink-0 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[15px]">public</span>
                  <span>زيارة</span>
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
