import { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'من نحن | إلكترو توب',
  description: 'تعرف على إلكترو توب، موزعين معتمدين للسويدي إلكتريك، ميتسوبيشي، هيمل، ABB، وفينوس. خبرة في توريد المستلزمات الكهربائية للمشاريع السكنية والتجارية والصناعية.',
  alternates: {
    canonical: '/about',
  },
};

export default async function AboutPage() {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get('x-nonce') || undefined;
  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      <div className="bg-on-background py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="material-symbols-outlined text-[56px] text-primary mb-3 select-none">
            info
          </span>
          <h1 className="font-bold text-[32px] md:text-[38px] text-white tracking-tight mb-2">
            من نحن
          </h1>
          <p className="text-surface-variant/80 text-sm max-w-xl mx-auto leading-relaxed">
            قصة إلكترو توب ورسالتنا في توريد أفضل المستلزمات الكهربائية
          </p>
        </div>
      </div>

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Our Story */}
          <section>
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 mb-4">
              قصتنا
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              إلكترو توب هو متجر متخصص في توريد وبيع المستلزمات الكهربائية عالية الجودة في مصر. نعمل كموزعين معتمدين لأشهر العلامات التجارية العالمية والمحلية، ونسعى لتوفير أفضل المنتجات بأسعار تنافسية للمقاولين والمهندسين والمستهلكين.
            </p>
          </section>

          {/* Mission */}
          <section>
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 mb-4">
              رسالتنا
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              رسالتنا هي توفير حلول كهربائية متكاملة وموثوقة تلبي احتياجات المشاريع السكنية والتجارية والصناعية. نلتزم بأعلى معايير الجودة والأمان لضمان رضا عملائنا وسلامة مشاريعهم.
            </p>
          </section>

          {/* Brands */}
          <section>
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 mb-4">
              العلامات التجارية
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
              نعمل مع أبرز العلامات التجارية في مجال المستلزمات الكهربائية:
            </p>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['السويدي إلكتريك', 'ميتسوبيشي', 'هيمل', 'ABB', 'فينوس'].map((brand) => (
                <li key={brand} className="bg-surface-container-low rounded-xl p-4 text-center font-bold text-on-surface text-sm border border-outline-variant/20">
                  {brand}
                </li>
              ))}
            </ul>
          </section>

          {/* Products */}
          <section>
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 mb-4">
              منتجاتنا
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
              نوفر مجموعة شاملة من المنتجات الكهربائية تشمل:
            </p>
            <ul className="space-y-2 text-on-surface-variant text-sm">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                الأسلاك الكهربائية (نحاسي وألمنيوم)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                الكابلات وأنواعها
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                لوحات التوزيع
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                قواطع الحماية (السيرك بريكر)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                مجاري الأسلاك التركية
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                الإطارات واللوحات المعدنية
              </li>
            </ul>
          </section>

          {/* Coverage */}
          <section>
            <h2 className="font-bold text-[22px] text-on-surface border-r-4 border-primary pr-3 mb-4">
              خدمات التوصيل
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              نوفر خدمة توصيل سريعة وموثوقة لجميع أنحاء مصر. سواء كنت في الإسكندرية، القاهرة، أو أي محافظة أخرى، نضمن وصول طلبك بأمان وفي الوقت المحدد.
            </p>
          </section>
        </div>
      </div>

      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'إلكترو توب',
            description: 'موزعون معتمدون للسويدي إلكتريك، ميتسوبيشي، هيمل، ABB، وفينوس.',
            url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
            areaServed: 'EG',
          }).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}
