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
    <div className="w-full font-poppins text-on-surface bg-white">
      <section className="relative bg-on-background py-28 md:py-36 overflow-hidden hero-clip">
        <div className="absolute inset-0 diagonal-accents opacity-10"></div>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="max-w-2xl text-start">
            <span className="text-electro-gold font-bold text-xs uppercase tracking-widest block mb-3 animate-fade-in">
              Ø§Ù„Ù…Ø³ØªÙ„Ø²Ù…Ø§Øª Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© ÙˆØ­Ù„ÙˆÙ„ Ø§Ù„Ù‡Ù†Ø¯Ø³Ø©
            </span>
            <h1 className="font-display-lg text-[40px] md:text-[56px] text-white mb-6 leading-tight font-extrabold animate-fade-in-up">
              Ø·Ø§Ù‚Ø© Ù‡Ù†Ø¯Ø³ÙŠØ© <br /> <span className="text-electro-red">ÙˆØ¯Ù‚Ø© Ø¹Ø§Ù„ÙŠØ©</span>
            </h1>
            <p className="text-surface-variant/80 text-body-lg mb-10 leading-relaxed max-w-2xl">
              Ø§ÙƒØªØ´Ù Ù…Ø¬Ù…ÙˆØ¹Ø© Ø´Ø§Ù…Ù„Ø© Ù…Ù† Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© Ù…Ù† Ø§Ù„Ø¹Ù„Ø§Ù…Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© Ø§Ù„Ø±Ø§Ø¦Ø¯Ø© Ù…Ø«Ù„ Ø§Ù„Ø³ÙˆÙŠØ¯ÙŠ Ø¥Ù„ÙƒØªØ±ÙŠÙƒØŒ Ø´Ù†Ø§ÙŠØ¯Ø±ØŒ Ø³ÙŠÙ…Ù†Ø²ØŒ Ù‡ÙŠÙ…ÙŠÙ„ØŒ Ø¬ÙŠÙˆÙŠØ³ØŒ ÙˆØ´ÙŠÙ†Øª. ÙƒÙ…ÙˆØ²Ø¹ÙŠÙ† Ù…Ø¹ØªÙ…Ø¯ÙŠÙ†ØŒ Ù†ÙˆÙØ± Ù‚ÙˆØ§Ø·Ø¹ Ø§Ù„Ø­Ù…Ø§ÙŠØ© ÙˆØ§Ù„ÙƒØ§Ø¨Ù„Ø§Øª ÙˆÙ„ÙˆØ­Ø§Øª Ø§Ù„ØªÙˆØ²ÙŠØ¹ ÙˆØ§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØ© Ø§Ù„Ù…ØªØ®ØµØµØ© Ù„Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ø³ÙƒÙ†ÙŠØ© ÙˆØ§Ù„ØªØ¬Ø§Ø±ÙŠØ© ÙˆØ§Ù„ØµÙ†Ø§Ø¹ÙŠØ©.
            </p>
            <div className="flex gap-4">
              <Link
                href="/shop"
                className="bg-electro-red text-white px-10 py-4 rounded-lg font-label-md hover:scale-105 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20 uppercase tracking-wider text-xs font-bold"
              >
                ØªØ³ÙˆÙ‚ Ù…Ù† Ø§Ù„Ù…ØªØ¬Ø±
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
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Ù…Ø¬Ù…ÙˆØ¹Ø§Øª Ù…Ø®ØªØ§Ø±Ø© Ø¨Ø¹Ù†Ø§ÙŠØ©</span>
          <h2 className="font-headline-lg text-headline-lg mt-2 mb-4 font-bold text-on-surface">Ø§Ù„Ø£Ù‚Ø³Ø§Ù… Ø§Ù„Ù…Ù…ÙŠØ²Ø©</h2>
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
                    alt={`${category} - Ù…Ø¬Ù…ÙˆØ¹Ø©`}
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
                    Ø§Ø³ØªÙƒØ´Ù Ù…Ø¬Ù…ÙˆØ¹ØªÙ†Ø§ Ø§Ù„Ù…Ù…ØªØ§Ø²Ø© Ù…Ù† Ù…Ø³ØªÙ„Ø²Ù…Ø§Øª {category}.
                  </p>
                  <span className="mt-4 text-electro-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:-translate-x-1 transition-transform justify-start">
                    ØªØµÙØ­ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© <span className="material-symbols-outlined text-xs rotate-180">arrow_forward</span>
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
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Ù„Ù…Ø§Ø°Ø§ ØªØ®ØªØ§Ø±Ù†Ø§</span>
            <h2 className="font-headline-lg text-headline-lg mt-2 mb-4 font-bold text-on-surface">Ù…Ø¹Ø§ÙŠÙŠØ± Ø¥Ù„ÙƒØªØ±Ùˆ ØªÙˆØ¨</h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">local_shipping</span>
              </div>
              <h3 className="font-headline-md text-[18px] text-on-background font-bold mb-2">Ø§Ù„ØªÙˆØµÙŠÙ„ Ù„Ù„Ù…ÙˆÙ‚Ø¹</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                ØªÙˆØµÙŠÙ„ Ø³Ø±ÙŠØ¹ ÙˆØ¢Ù…Ù† Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ù…ÙˆØ§Ù‚Ø¹ Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ Ø£Ùˆ Ù…Ø®Ø§Ø²Ù†Ùƒ ÙÙŠ Ø¬Ù…ÙŠØ¹ Ø£Ù†Ø­Ø§Ø¡ Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ© ÙˆØ¬Ù…Ù‡ÙˆØ±ÙŠØ© Ù…ØµØ± Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
              </div>
              <h3 className="font-headline-md text-[18px] text-on-background font-bold mb-2">Ù…Ù†ØªØ¬Ø§Øª Ø£ØµÙ„ÙŠØ© 100%</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                Ù…ÙˆØ²Ø¹ Ù…Ø¹ØªÙ…Ø¯ ÙŠØ¶Ù…Ù† Ù…Ù†ØªØ¬Ø§Øª Ø£ØµÙ„ÙŠØ© Ù…Ø¹ØªÙ…Ø¯Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ù† Ø§Ù„Ø³ÙˆÙŠØ¯ÙŠØŒ Ø´Ù†Ø§ÙŠØ¯Ø±ØŒ Ø³ÙŠÙ…Ù†Ø²ØŒ Ù‡ÙŠÙ…ÙŠÙ„ØŒ Ø¬ÙŠÙˆÙŠØ³ØŒ ÙˆØ´ÙŠÙ†Øª.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-[32px]">payments</span>
              </div>
              <h3 className="font-headline-md text-[18px] text-on-background font-bold mb-2">Ø£ÙØ¶Ù„ Ù‚ÙŠÙ…Ø©</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                Ù‡ÙŠØ§ÙƒÙ„ ØªØ³Ø¹ÙŠØ± ØªÙ†Ø§ÙØ³ÙŠØ© Ù„Ù„ØºØ§ÙŠØ© Ù„Ù„Ø¬Ù…Ù„Ø© ÙˆØ§Ù„ØªØ¬Ø²Ø¦Ø© Ø¹Ù„Ù‰ Ø¬Ù…ÙŠØ¹ ÙƒØ§Ø¨Ù„Ø§Øª Ø§Ù„Ø·Ø§Ù‚Ø© ÙˆÙ‚ÙˆØ§Ø·Ø¹ Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ©.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-on-background py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 diagonal-accents opacity-5"></div>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <h2 className="font-display-lg text-headline-lg text-white mb-4 font-bold">
            Ù‡Ù„ Ø£Ù†Øª Ø¬Ø§Ù‡Ø² Ù„ØªØ²ÙˆÙŠØ¯ Ù…Ø´Ø±ÙˆØ¹Ùƒ Ø¨Ø§Ù„Ø·Ø§Ù‚Ø©ØŸ
          </h2>
          <p className="text-surface-variant/70 text-body-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Ø§Ù†Ø¶Ù… Ø¥Ù„Ù‰ Ø§Ù„Ù…Ù‚Ø§ÙˆÙ„ÙŠÙ† ÙˆØ§Ù„Ù…Ù‡Ù†Ø¯Ø³ÙŠÙ† Ø§Ù„Ø°ÙŠÙ† ÙŠØ«Ù‚ÙˆÙ† ÙÙŠ Ø¥Ù„ÙƒØªØ±Ùˆ ØªÙˆØ¨ Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙˆÙ…Ø³ØªÙ„Ø²Ù…Ø§Øª Ø§Ù„ØªÙˆØµÙŠÙ„.
          </p>
          <Link
            href="/shop"
            className="bg-electro-red text-white px-12 py-4.5 rounded-lg font-label-md hover:scale-105 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20 uppercase tracking-widest text-xs font-bold inline-block"
          >
            Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…ØªØ¬Ø±
          </Link>
        </div>
      </section>
    </div>
  );
});
