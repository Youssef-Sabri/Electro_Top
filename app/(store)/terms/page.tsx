import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الشروط والأحكام | إلكترو توب',
  description: 'الشروط والأحكام الخاصة باستخدام متجر إلكترو توب الإلكتروني وشراء المنتجات.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      <div className="bg-on-background py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="material-symbols-outlined text-[56px] text-primary mb-3 select-none">
            gavel
          </span>
          <h1 className="font-bold text-[32px] md:text-[38px] text-white tracking-tight mb-2">
            الشروط والأحكام
          </h1>
          <p className="text-surface-variant/80 text-sm max-w-xl mx-auto leading-relaxed">
            الشروط والقواعد الخاصة باستخدام متجر إلكترو توب
          </p>
        </div>
      </div>

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <div className="max-w-3xl mx-auto space-y-10 text-on-surface-variant text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">1. القبول بالشروط</h2>
            <p>
              باستخدامك لمتجر إلكترو توب الإلكتروني، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">2. المنتجات والأسعار</h2>
            <p>
              جميع الأسعار المعروضة على الموقع بالجنيه المصري (EGP) وتشمل ضريبة القيمة المضافة. نحتفظ بحق تغيير الأسعار في أي وقت دون إشعار مسبق. الصور توضيحية وقد تختلف عن المنتج الفعلي.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">3. الطلبات والتوصيل</h2>
            <p>
              يتم تأكيد الطلبات بعد مراجعتها من فريقنا. نوفر توصيل لجميع أنحاء مصر. قد تختلف رسوم التوصيل حسب الموقع والحجم. نلتزم بأقصى جهد في التزام بالمواعيد المحددة.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">4. الدفع</h2>
            <p>
              نوفر الدفع عند الاستلام (COD) أو التحويل الفوري عبر إنستا باي (InstaPay). يُرجى التأكد من صحة بيانات الدفع لتجنب أي تأخير في معالجة الطلب.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">5. الإرجاع والاستبدال</h2>
            <p>
              يحق للمشتري إرجاع المنتج خلال 7 أيام من تاريخ الاستلام بشرط أن يكون المنتج في حالته الأصلية وغير مستخدم. لا يشمل ذلك المنتجات المفتوحة أو المستخدمة. يتم استرداد المبلغ خلال 5-7 أيام عمل.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">6. الضمان</h2>
            <p>
              جميع المنتجات تحمل ضمان الموزع الرسمي. يختلف مدة الضمان حسب المنتج والعلامة التجارية. يرجى مراجعة تفاصيل الضمان مع كل منتج.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">7. المسؤولية</h2>
            <p>
              نبذل قصارى جهدنا لضمان دقة المعلومات المعروضة على الموقع. غير أننا لا نتحمل المسؤولية عن أي أخطاء أو سهو في المحتوى. كما أننا لا نتحمل المسؤولية عن أي أضرار ناتجة عن استخدام المنتجات بشكل غير صحيح.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">8. الخصوصية</h2>
            <p>
              نحترم خصوصيتك. جميع البيانات الشخصية المجمعة تُستخدم فقط لمعالجة الطلبات والتواصل معك. لا نشارك بياناتك مع أطراف ثالثة إلا عند الضرورة. يرجى مراجعة سياسة الخصوصية لمزيد من التفاصيل.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">9. التعديلات</h2>
            <p>
              نحتفظ بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة. استمرارك في استخدام الموقع بعد نشر التعديلات يُعتبر قبولاً بها.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">10. التواصل</h2>
            <p>
              لأي استفسارات حول الشروط والأحكام، يرجى التواصل معنا عبر صفحة الدعم أو عبر واتساب على الأرقام الموضحة في الموقع.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
