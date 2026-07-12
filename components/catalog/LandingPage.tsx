'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

interface CategorySlideshowCardProps {
  category: string;
  products: Product[];
  productCount: number;
}

export function CategorySlideshowCard({ category, products, productCount }: CategorySlideshowCardProps) {
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  const rawImages = useMemo(() => {
    const urls = products
      .map((p) => p.image_url)
      .filter((url): url is string => !!url);
    return Array.from(new Set(urls));
  }, [products]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShuffledImages([...rawImages].sort(() => Math.random() - 0.5));
    }, 0);
    return () => clearTimeout(timer);
  }, [rawImages]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevImages, setPrevImages] = useState<string[]>(shuffledImages);

  if (prevImages !== shuffledImages) {
    const boundedIndex = shuffledImages.length > 0 ? Math.min(currentIndex, shuffledImages.length - 1) : 0;
    setPrevImages(shuffledImages);
    setCurrentIndex(boundedIndex);
  }

  useEffect(() => {
    if (shuffledImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [shuffledImages]);

  const currentImg = shuffledImages[currentIndex];

  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category)}`}
      className="group relative h-[380px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 active:scale-[0.98] active:shadow-md border border-outline-variant/20 w-full block bg-white"
    >
      <div className="absolute inset-0 w-full h-full select-none pointer-events-none bg-white">
        {currentImg ? (
          <div
            key={currentImg}
            className="absolute inset-0"
            style={{
              animation: 'fadeInScale 800ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Image
              src={currentImg}
              alt={`${category} - ${currentIndex}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={70}
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container to-surface-container-low" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6 text-start z-10">
        <h3 className="font-headline-md text-white font-bold text-[20px]">{category}</h3>
        {productCount > 0 && (
          <span className="text-white/60 text-xs mt-1 font-semibold">
            {productCount} منتج
          </span>
        )}
        <p className="text-white/70 text-xs mt-2 leading-relaxed">
          استكشف مجموعتنا الممتازة من {category}.
        </p>
        <span className="mt-4 text-electro-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-300 justify-start">
          تصفح المجموعة <span className="material-symbols-outlined text-xs rotate-180">arrow_forward</span>
        </span>
      </div>
    </Link>
  );
}

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

  const [hierarchy, setHierarchy] = useState<{ name: string; subcategories: string[] }[]>([]);

  useEffect(() => {
    fetch('/api/admin/category-hierarchy')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHierarchy(data);
      })
      .catch((err) => console.error('Failed to load category hierarchy on landing page:', err));
  }, []);

  const categories = contextCategories.length > 0 ? contextCategories : initialCategories;

  const activeCategories = useMemo(() => {
    const list = (categories || [])
      .filter((cat) => cat.toLowerCase() !== 'all' && cat.toLowerCase() !== 'all categories');
    
    if (hierarchy.length > 0) {
      const mainCatNames = hierarchy.map(h => h.name);
      const filtered = list.filter(cat => mainCatNames.includes(cat));
      if (filtered.length > 0) return filtered;
    }
    return list;
  }, [categories, hierarchy]);

  const activeProds = products.length > 0 ? products : initialProducts;

  const categoryProducts = useMemo(() => {
    const mapping: Record<string, Product[]> = {};
    activeCategories.forEach((category) => {
      const group = hierarchy.find(h => h.name === category);
      const targetCategories = group 
        ? [category, ...group.subcategories] 
        : [category];

      mapping[category] = activeProds.filter(
        (p) => p.category && targetCategories.includes(p.category) && p.is_active
      );
    });
    return mapping;
  }, [activeCategories, activeProds, hierarchy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeCategories.forEach((category) => {
      const group = hierarchy.find(h => h.name === category);
      const targetCategories = group 
        ? [category, ...group.subcategories] 
        : [category];

      counts[category] = activeProds.filter(
        (p) => p.category && targetCategories.includes(p.category) && p.is_active
      ).length;
    });
    return counts;
  }, [activeCategories, activeProds, hierarchy]);

  const [shiftOffset, setShiftOffset] = useState(0);
  const [fadeCategories, setFadeCategories] = useState(true);

  useEffect(() => {
    if (activeCategories.length <= 3) return;

    const timeoutRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

    const interval = setInterval(() => {
      setFadeCategories(false);

      timeoutRef.current = setTimeout(() => {
        setShiftOffset((prev) => (prev + 1) % activeCategories.length);
        setFadeCategories(true);
      }, 500);
    }, 9000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeCategories.length]);

  const displayedCategories = useMemo(() => {
    if (activeCategories.length <= 3) return activeCategories;

    const list: string[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = (shiftOffset + i) % activeCategories.length;
      list.push(activeCategories[idx]);
    }
    return list;
  }, [activeCategories, shiftOffset]);

  return (
    <div className="w-full font-tajawal text-on-surface bg-white">
      {/* Sleek Hero Section */}
      <section className="relative bg-on-background py-28 md:py-36 overflow-hidden hero-clip">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="max-w-2xl text-start">
            <h1 className="font-display-lg text-[40px] md:text-[56px] text-white mb-6 leading-tight font-extrabold animate-fade-in-up">
              أسلاك السويدي ومستلزمات كهربائية <span className="text-primary">عالية الجودة</span></h1>
            <p className="text-surface-variant/80 text-lg mb-10 leading-relaxed max-w-2xl">
              موزعون معتمدون لدى السويدي إلكتريك، ميتسوبيشي ياباني، هيمل صيني، ABB، وفينوس. يتوفر لدينا جميع لوحات التوزيع وقواطع الحماية والكابلات ومجاري الأسلاك التركية للمشاريع السكنية والتجارية والصناعية.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="bg-primary hover:bg-primary-container active:scale-[0.97] text-on-primary px-10 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg shadow-primary/20 text-sm flex items-center gap-2"
              >
                تسوق من المتجر
                <span className="material-symbols-outlined text-sm rotate-180">arrow_forward</span>
              </Link>
              <Link
                href="/support"
                className="border border-white/30 text-white hover:bg-white/10 active:scale-[0.97] px-10 py-4 rounded-full font-semibold transition-all duration-200 text-sm"
              >
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden xl:block">
          <span
            className="material-symbols-outlined text-[380px] text-white/5 select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            developer_board
          </span>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
        <div className="max-w-lg mx-auto mb-16">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">مجموعات مختارة بعناية</span>
          <h2 className="font-headline-lg text-headline-lg mt-2 mb-4 font-bold text-on-surface">الأقسام المميزة</h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto"></div>
        </div>

        <div
          className="flex overflow-x-auto pb-6 scrollbar-hide -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-3 gap-6 md:gap-8 transition-all duration-500 ease-in-out snap-x snap-mandatory"
          style={{
            opacity: fadeCategories ? 1 : 0,
            transform: fadeCategories ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.995)',
            pointerEvents: fadeCategories ? 'auto' : 'none' as const
          }}
        >
          {displayedCategories.map((category, index) => (
            <div key={index} className="shrink-0 w-[82vw] sm:w-[340px] md:w-full snap-center">
              <CategorySlideshowCard
                category={category}
                products={categoryProducts[category] || []}
                productCount={categoryCounts[category] || 0}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-surface-container py-24 border-y border-outline-variant/20">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="max-w-lg mx-auto mb-16">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">لماذا تختارنا</span>
            <h2 className="font-headline-lg text-headline-lg mt-2 mb-4 font-bold text-on-surface">معايير إلكترو توب</h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-start md:text-center">
            {/* Card 1 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/20 shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex flex-row md:flex-col items-center md:items-center gap-5 md:gap-6 group cursor-default">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary group-hover:to-brand-red-dark group-hover:text-white flex items-center justify-center text-primary shrink-0 transition-all duration-[350ms] shadow-inner">
                <span className="material-symbols-outlined text-[28px] md:text-[32px]">local_shipping</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-md text-[16px] md:text-[18px] text-on-background font-bold mb-1 md:mb-2 group-hover:text-primary transition-colors duration-200">توصيل سريع إلى موقعك</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  نوصل طلباتك بسرعة وأمان إلى المشاريع، المصانع، الشركات، والمنازل داخل الإسكندرية وجميع محافظات مصر.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/20 shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex flex-row md:flex-col items-center md:items-center gap-5 md:gap-6 group cursor-default">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary group-hover:to-brand-red-dark group-hover:text-white flex items-center justify-center text-primary shrink-0 transition-all duration-[350ms] shadow-inner">
                <span className="material-symbols-outlined text-[28px] md:text-[32px]">workspace_premium</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-md text-[16px] md:text-[18px] text-on-background font-bold mb-1 md:mb-2 group-hover:text-primary transition-colors duration-200">منتجات أصلية بضمان الجودة</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  نعمل كموزعين معتمدين لأشهر العلامات التجارية مثل السويدي، شنايدر، ABB، سيمنس، هيميل، وجيوبس، لضمان أعلى مستويات الجودة والأمان.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/20 shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex flex-row md:flex-col items-center md:items-center gap-5 md:gap-6 group cursor-default">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary group-hover:to-brand-red-dark group-hover:text-white flex items-center justify-center text-primary shrink-0 transition-all duration-[350ms] shadow-inner">
                <span className="material-symbols-outlined text-[28px] md:text-[32px]">payments</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-md text-[16px] md:text-[18px] text-on-background font-bold mb-1 md:mb-2 group-hover:text-primary transition-colors duration-200">أفضل الأسعار</h3>
                <p className="text-on-surface-variant text-[13px] leading-relaxed">
                  دون المساومة على الجودة نوفر أسعارًا تنافسية للجملة والتجزئة على الأسلاك، الكابلات، القواطع، ولوحات التوزيع، مع أفضل قيمة مقابل السعر.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-on-background py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <h2 className="font-display-lg text-headline-lg text-white mb-4 font-bold">
            هل أنت مستعد لتزويد مشروعك بالطاقة؟
          </h2>
          <p className="text-surface-variant/80 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            انضم إلى المقاولين والمهندسين الذين يثقون في إلكترو توب للحصول على مكونات كهربائية أصلية وحلول توصيل موثوقة.
          </p>
          <Link
            href="/shop"
            className="bg-primary hover:bg-primary-container active:scale-[0.97] text-on-primary px-12 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg shadow-primary/20 text-sm inline-block"
          >
            دخول المتجر
          </Link>
        </div>
      </section>
    </div>
  );
});
LandingPage.displayName = 'LandingPage';
