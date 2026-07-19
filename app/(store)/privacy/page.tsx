import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | إلكترو توب',
  description: 'سياسة الخصوصية وحماية البيانات الشخصية لمتجر إلكترو توب الإلكتروني.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      <div className="bg-on-background py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="material-symbols-outlined text-[56px] text-primary mb-3 select-none">
            shield
          </span>
          <h1 className="font-bold text-[32px] md:text-[38px] text-white tracking-tight mb-2">
            سياسة الخصوصية
          </h1>
          <p className="text-surface-variant/80 text-sm max-w-xl mx-auto leading-relaxed">
            كيف نجمع ونستخدم ونحمي بياناتك الشخصية
          </p>
        </div>
      </div>

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <div className="max-w-3xl mx-auto space-y-10 text-on-surface-variant text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">1. البيانات التي نجمعها</h2>
            <p className="mb-2">نقوم بجمع البيانات التالية عند استخدامك لمتجرنا:</p>
            <ul className="space-y-1 mr-4 list-disc">
              <li>الاسم الكامل</li>
              <li>رقم الهاتف</li>
              <li>عنوان الشحن</li>
              <li>البريد الإلكتروني (اختياري)</li>
              <li>بيانات الموقع (عند استخدام خرائط جوجل)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">2. كيف نستخدم بياناتك</h2>
            <p className="mb-2">نستخدم بياناتك الشخصية للأغراض التالية:</p>
            <ul className="space-y-1 mr-4 list-disc">
              <li>معالجة وتنفيذ طلباتك</li>
              <li>التواصل معك بخصوص طلبك</li>
              <li>تتبع حالة الطلب</li>
              <li>تحسين تجربة التسوق</li>
              <li>إرسال العروض والتحديثات (بموافقتك)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">3. حماية البيانات</h2>
            <p>
              نتخذ تدابير أمنية صارمة لحماية بياناتك الشخصية من الوصول غير المصرح به أو الاستخدام أو الإفصاح. جميع البيانات تُخزن بشكل آمن وتُشفّر أثناء النقل.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">4. مشاركة البيانات</h2>
            <p>
              لا نبيع أو نشارك بياناتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
            </p>
            <ul className="space-y-1 mr-4 list-disc mt-2">
              <li>شركات الشحن والتوصيل لتنفيذ طلبك</li>
              <li>بموجب طلب قانوني أو محكمة</li>
              <li>لحماية حقوقنا القانونية</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">5. ملفات تعريف الارتباط (Cookies)</h2>
            <p>
              نستخدم ملفات تعريف الارتباط الضرورية لتشغيل الموقع بشكل صحيح. هذه الملفات لا تتبع نشاطك خارج الموقع ولا تُستخدم لأغراض إعلانية.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">6. حقوقك</h2>
            <p className="mb-2">يحق لك:</p>
            <ul className="space-y-1 mr-4 list-disc">
              <li>طلب الاطلاع على بياناتك الشخصية المحفوظة</li>
              <li>طلب تصحيح أي بيانات غير صحيحة</li>
              <li>طلب حذف بياناتك الشخصية</li>
              <li>الاعتراض على معالجة بياناتك</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">7. الاحتفاظ بالبيانات</h2>
            <p>
              نحتفظ ببياناتك الشخصية فقط للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها، أو كما يتطلب القانون.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">8. التحديثات</h2>
            <p>
              قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ آخر تحديث.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[18px] text-on-surface mb-3">9. التواصل</h2>
            <p>
              لأي استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر صفحة الدعم أو عبر واتساب.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
