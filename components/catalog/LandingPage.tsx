'use client';

import { memo, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

interface LandingPageProps {
  initialCategories?: string[];
  initialProducts?: Product[];
}

export const LandingPage = memo(function LandingPage({ initialCategories = [], initialProducts = [] }: LandingPageProps) {
  const { categories: contextCategories, products, initializeData, isLoaded } = useProducts();

  useEffect(() => {
    if (!isLoaded && initialProducts.length > 0) {
      initializeData(initialProducts, initialCategories);
    }
  }, [isLoaded, initialProducts, initialCategories, initializeData]);

  const categories = contextCategories.length > 0 ? contextCategories : initialCategories;

  const activeCategories = useMemo(() => {
    return (categories || [])
      .filter((cat) => cat.toLowerCase() !== 'all' && cat.toLowerCase() !== 'all categories')
      .slice(0, 3);
  }, [categories]);

  const categoryImages = useMemo(() => {
    const activeProds = products.length > 0 ? products : initialProducts;
    const images: Record<string, string | null> = {};
    activeCategories.forEach((category) => {
      const product = activeProds.find(
        (p) => p.category === category && p.image_url && p.is_active
      );
      images[category] = product?.image_url ?? null;
    });
    return images;
  }, [activeCategories, products, initialProducts]);


  return (
    <div className="w-full font-tajawal text-on-surface bg-white">
      <section className="relative bg-on-background py-28 md:py-36 overflow-hidden hero-clip">
        <div className="absolute inset-0 diagonal-accents opacity-10"></div>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="max-w-2xl text-start">

            <h1 className="font-display-lg text-[40px] md:text-[56px] text-white mb-6 leading-tight font-extrabold animate-fade-in-up">
              اسلاك السويدي ومستلزمات كهرابائيه <span className="text-electro-red">عالية الجوده</span>
            </h1>
            <p className="text-surface-variant/80 text-body-lg mb-10 leading-relaxed max-w-2xl">
              موزعين معتمدين لدي السويدى الكتيرك، متسوبيشى يابانى، هيمل صينى، ABB (الوطنية)، فينوس ويوجد لدينا جميع اللوحات و مجري الاسلاك التركي. نوفر كل قواطع الحماية والكابلات ولوحات التوزيع والاستشارات الهندسية المتخصصة للمشاريع السكنية والتجارية والصناعية.
            </p>
            <div className="flex gap-4">
              <Link
                href="/shop"
                className="bg-electro-red text-white px-10 py-4 rounded-lg font-label-md hover:scale-105 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20 uppercase tracking-wider text-xs font-bold"
              >
                تسوق من المتجر
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden xl:block">
          <span
            className="material-symbols-outlined text-[420px] text-white/5 select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            developer_board
          </span>
        </div>
      </section>
 
      <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
        <div className="max-w-lg mx-auto mb-16">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">مجموعات مختارة بعناية</span>
          <h2 className="font-headline-lg text-headline-lg mt-2 mb-4 font-bold text-on-surface">الأقسام المميزة</h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeCategories.map((category) => {
            const imageUrl = categoryImages[category];

            return (
              <Link
                key={category}
                href={`/shop?category=${encodeURIComponent(category)}`}
                className="group relative h-[380px] rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-outline-variant/10"
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`${category} - مجموعة`}
                    fill
                    className="object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={70}
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-on-background via-on-background/90 to-on-background/70" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-left">
                  <h3 className="font-headline-md text-white font-bold text-[20px] text-start">{category}</h3>
                  <p className="text-surface-variant/80 text-xs mt-1.5 leading-relaxed text-start">
                    استكشف مجموعتنا الممتازة من مستلزمات {category}.
                  </p>
                  <span className="mt-4 text-electro-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:-translate-x-1 transition-transform justify-start">
                    تصفح المجموعة <span className="material-symbols-outlined text-xs rotate-180">arrow_forward</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-container py-24 border-y border-outline-variant/20">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="max-w-lg mx-auto mb-16">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">لماذا تختارنا</span>
            <h2 className="font-headline-lg text-headline-lg mt-2 mb-4 font-bold text-on-surface">معايير إلكترو توب</h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">local_shipping</span>
              </div>
              <h3 className="font-headline-md text-[18px] text-on-background font-bold mb-2">توصيل سريع إلى موقعك</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                نوصل طلباتك بسرعة وأمان إلى المشاريع، المصانع، الشركات، والمنازل داخل الإسكندرية وجميع محافظات مصر.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
              </div>
              <h3 className="font-headline-md text-[18px] text-on-background font-bold mb-2">منتجات أصلية بضمان الجودة</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                نعمل كموزعين معتمدين لأشهر العلامات التجارية مثل السويدي، شنايدر، ABB، سيمنس، هيميل، وجيوبس، لضمان أعلى مستويات الجودة والأمان.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">payments</span>
              </div>
              <h3 className="font-headline-md text-[18px] text-on-background font-bold mb-2">أفضل الأسعار</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                دون المساومة على الجودة نوفر أسعارًا تنافسية للجملة والتجزئة على الأسلاك، الكابلات، القواطع، ولوحات التوزيع، مع أفضل قيمة مقابل السعر.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-on-background py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 diagonal-accents opacity-5"></div>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <h2 className="font-display-lg text-headline-lg text-white mb-4 font-bold">
            هل أنت مستعد لتزويد مشروعك بالطاقة؟
          </h2>
          <p className="text-surface-variant/70 text-body-lg max-w-xl mx-auto mb-10 leading-relaxed">
            انضم إلى المقاولين والمهندسين الذين يثقون في إلكترو توب للحصول على مكونات كهربائية أصلية وحلول توصيل موثوقة.
          </p>
          <Link
            href="/shop"
            className="bg-electro-red text-white px-12 py-4.5 rounded-lg font-label-md hover:scale-105 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20 uppercase tracking-widest text-xs font-bold inline-block"
          >
            دخول المتجر
          </Link>
        </div>
      </section>
    </div>
  );
});
