import { Metadata } from 'next';
import { getSupportEnv } from '@/lib/env-utils';

export const metadata: Metadata = {
  title: 'الاتصال والدعم | إلكترو توب',
  description: 'تواصل مع فريق الدعم للاستفسارات والمساعدة.',
};

export default function SupportPage() {
  const { whatsapp: whatsappNumber, facebook: facebookUrl, phone: phoneNumber } = getSupportEnv();

    return (
      <div className="min-h-screen bg-surface-bright font-poppins">
        <div className="bg-on-background text-white py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="material-symbols-outlined text-[64px] text-primary mb-4 select-none">
            support_agent
          </span>
          <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight mb-2">
            الاتصال والدعم
          </h1>
          <p className="text-surface-variant/80 text-body-lg max-w-xl mx-auto">
            هل تحتاج إلى مساعدة في طلبك أو لديك أي استفسار؟ تواصل مع فريقنا مباشرة.
          </p>
        </div>
      </div>

      {/* Support Options Grid */}
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white border border-outline-variant/30 rounded-2xl p-8 text-center flex flex-col items-center justify-between hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.452 5.428 0 9.845-4.415 9.848-9.848.002-2.63-1.02-5.1-2.877-6.958-1.857-1.859-4.329-2.88-6.963-2.882-5.435 0-9.85 4.417-9.853 9.851-.001 1.768.463 3.493 1.344 5.011l-.982 3.585 3.666-.961zm11.233-7.042c-.295-.148-1.748-.862-2.016-.96-.268-.098-.463-.148-.658.148-.195.295-.756.96-.927 1.157-.17.196-.341.22-.636.073-.295-.148-1.246-.459-2.375-1.464-.877-.783-1.47-1.75-1.642-2.046-.172-.295-.018-.455.13-.602.133-.132.296-.345.443-.518.148-.173.196-.296.296-.494.098-.198.049-.37-.025-.518-.073-.148-.658-1.586-.902-2.179-.237-.57-.497-.493-.68-.502-.17-.008-.365-.01-.56-.01-.195 0-.512.073-.78.365-.268.293-1.024 1.002-1.024 2.443 0 1.442 1.049 2.839 1.195 3.037.147.197 2.064 3.153 5.001 4.426.699.303 1.244.484 1.67.62.704.224 1.345.193 1.851.118.563-.083 1.748-.714 1.992-1.403.243-.689.243-1.278.17-1.402-.073-.125-.268-.198-.563-.346z" />
                </svg>
              </div>
              <h2 className="text-headline-sm font-bold text-on-surface mb-2">واتساب</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                الدعم الأسرع! راسلنا مباشرة عبر واتساب للطلبات، الاستفسارات، أو لتأكيد التحويل المالي.
              </p>
            </div>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-label-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] select-none">chat</span>
                مراسلتنا عبر واتساب
              </a>
            )}
          </div>

          {/* Facebook Card */}
          <div className="bg-white border border-outline-variant/30 rounded-2xl p-8 text-center flex flex-col items-center justify-between hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <h2 className="text-headline-sm font-bold text-on-surface mb-2">صفحة فيسبوك</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                تابع صفحتنا الرسمية، تصفح المنتجات الجديدة، أو أرسل لنا رسالة خاصة عبر ماسنجر.
              </p>
            </div>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-xl font-label-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] select-none">public</span>
              زيارة صفحة فيسبوك
            </a>
          </div>

          {/* Call Us Card */}
          <div className="bg-white border border-outline-variant/30 rounded-2xl p-8 text-center flex flex-col items-center justify-between hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px] select-none">
                  phone_in_talk
                </span>
              </div>
              <h2 className="text-headline-sm font-bold text-on-surface mb-2">اتصال هاتفي</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                هل تفضل التحدث عبر الهاتف؟ اتصل بنا مباشرة للتحدث مع ممثلي متجرنا.
              </p>
            </div>
            <a
              href={`tel:${phoneNumber}`}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 px-6 rounded-xl font-label-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] select-none">phone</span>
              اتصل بنا الآن
            </a>
          </div>
        </div>
      </div>
    </div>

  );
}
