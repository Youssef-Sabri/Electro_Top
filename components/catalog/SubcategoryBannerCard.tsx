'use client';

import React, { memo, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getBannerTheme } from '@/lib/utils/color';
import type { SubcategoryBanner } from '@/types';

interface SubcategoryBannerCardProps {
  banner: SubcategoryBanner | {
    subcategory_name: string;
    title: string;
    subtitle?: string | null;
    discount_percentage?: number | string | null;
    discount_badge?: string | null;
    banner_color?: string | null;
    image_url?: string | null;
    is_active?: boolean;
  };
  fallbackImageUrl?: string | null;
  categoryImages?: string[];
  interactiveLink?: boolean;
  variant?: 'full' | 'compact';
  className?: string;
}

// Memoized Product Image Fan Trio sub-component (Prevents outer banner re-renders)
const FanPlaceholder = memo(function FanPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full rounded sm:rounded-lg bg-gradient-to-br from-black/40 to-white/10 flex items-center justify-center text-yellow-300">
      {children}
    </div>
  );
});

const BannerImageFan = memo(function BannerImageFan({
  imagePool,
  bannerTitle,
}: {
  imagePool: string[];
  bannerTitle: string;
}) {
  const [activeBaseIndex, setActiveBaseIndex] = useState(0);

  // Dynamic random image rotation every 3 seconds
  useEffect(() => {
    if (imagePool.length <= 1) {
      setActiveBaseIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setActiveBaseIndex((prev) => {
        let nextIndex = Math.floor(Math.random() * imagePool.length);
        if (nextIndex === prev && imagePool.length > 1) {
          nextIndex = (prev + 1) % imagePool.length;
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [imagePool]);

  // Compute 3 distinct images for 3 slots
  const slotImages = useMemo(() => {
    const total = imagePool.length;
    if (total === 0) return [null, null, null];
    if (total === 1) return [imagePool[0], null, null];
    if (total === 2) return [imagePool[activeBaseIndex % 2], imagePool[(activeBaseIndex + 1) % 2], null];

    const slot0 = imagePool[activeBaseIndex % total];
    const slot1 = imagePool[(activeBaseIndex + 1) % total];
    const slot2 = imagePool[(activeBaseIndex + 2) % total];
    return [slot0, slot1, slot2];
  }, [imagePool, activeBaseIndex]);

  return (
    <div className="relative shrink-0 flex items-center justify-center">
      <div className="relative flex items-center justify-center -space-x-2 sm:-space-x-5 rtl:space-x-reverse py-1">
        
        {/* Card 0 (Left Fan Card) */}
        <div className="relative group/card transform -rotate-6 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-500 animate-banner-float z-10 w-9 h-9 sm:w-16 sm:h-16 md:w-20 md:h-20">
          <div className="absolute -inset-1 rounded-xl bg-white/20 blur-sm opacity-60 group-hover/card:opacity-90 transition-opacity" />
          <div className="relative w-full h-full rounded-lg sm:rounded-xl border border-white/30 bg-white/20 backdrop-blur-md p-0.5 sm:p-1 shadow-lg overflow-hidden">
            {slotImages[0] ? (
              <div className="relative w-full h-full rounded sm:rounded-lg overflow-hidden bg-white/95">
                <Image
                  key={slotImages[0]}
                  src={slotImages[0]}
                  alt={bannerTitle}
                  fill
                  sizes="(max-width: 640px) 36px, 80px"
                  className="object-contain p-0.5 sm:p-1 animate-[fadeInScale_0.4s_ease-out]"
                />
              </div>
            ) : (
              <FanPlaceholder>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </FanPlaceholder>
            )}
          </div>
        </div>

        {/* Card 1 (Center Highlighted Card) */}
        <div className="relative group/card transform rotate-0 hover:scale-110 hover:z-30 transition-all duration-500 animate-banner-float z-20 w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/40 to-white/30 blur-md opacity-70 group-hover/card:opacity-100 transition-opacity" />
          <div className="relative w-full h-full rounded-lg sm:rounded-xl border-2 border-white/40 bg-white/25 backdrop-blur-md p-1 sm:p-1.5 shadow-2xl overflow-hidden">
            {slotImages[1] || slotImages[0] ? (
              <div className="relative w-full h-full rounded sm:rounded-lg overflow-hidden bg-white/95">
                <Image
                  key={slotImages[1] || slotImages[0]}
                  src={(slotImages[1] || slotImages[0])!}
                  alt={bannerTitle}
                  fill
                  sizes="(max-width: 640px) 48px, 96px"
                  className="object-contain p-0.5 sm:p-1 animate-[fadeInScale_0.4s_ease-out]"
                />
              </div>
            ) : (
              <FanPlaceholder>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </FanPlaceholder>
            )}
          </div>
        </div>

        {/* Card 2 (Right Fan Card) */}
        <div className="relative group/card transform rotate-6 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-500 animate-banner-float z-10 w-9 h-9 sm:w-16 sm:h-16 md:w-20 md:h-20">
          <div className="absolute -inset-1 rounded-xl bg-white/20 blur-sm opacity-60 group-hover/card:opacity-90 transition-opacity" />
          <div className="relative w-full h-full rounded-lg sm:rounded-xl border border-white/30 bg-white/20 backdrop-blur-md p-0.5 sm:p-1 shadow-lg overflow-hidden">
            {slotImages[2] || slotImages[0] ? (
              <div className="relative w-full h-full rounded sm:rounded-lg overflow-hidden bg-white/95">
                <Image
                  key={slotImages[2] || slotImages[0]}
                  src={(slotImages[2] || slotImages[0])!}
                  alt={bannerTitle}
                  fill
                  sizes="(max-width: 640px) 36px, 80px"
                  className="object-contain p-0.5 sm:p-1 animate-[fadeInScale_0.4s_ease-out]"
                />
              </div>
            ) : (
              <FanPlaceholder>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </FanPlaceholder>
            )}
          </div>
        </div>

      </div>
    </div>
  );
});

export const SubcategoryBannerCard = memo(function SubcategoryBannerCard({
  banner,
  fallbackImageUrl,
  categoryImages,
  interactiveLink = false,
  variant = 'full',
  className = '',
}: SubcategoryBannerCardProps) {
  const theme = getBannerTheme(banner.banner_color);
  const pctNum = typeof banner.discount_percentage === 'number'
    ? banner.discount_percentage
    : parseFloat(banner.discount_percentage || '0');

  const isCompact = variant === 'compact';

  // Build pool of available unique product images
  const imagePool = useMemo(() => {
    const list: string[] = [];
    if (banner.image_url?.trim()) list.push(banner.image_url.trim());
    if (categoryImages && categoryImages.length > 0) {
      categoryImages.forEach((url) => {
        if (url && url.trim().length > 0 && !list.includes(url.trim())) {
          list.push(url.trim());
        }
      });
    }
    if (fallbackImageUrl?.trim() && !list.includes(fallbackImageUrl.trim())) {
      list.push(fallbackImageUrl.trim());
    }
    return list;
  }, [banner.image_url, categoryImages, fallbackImageUrl]);

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (interactiveLink && banner.subcategory_name) {
      return (
        <Link
          href={`/shop?category=${encodeURIComponent(banner.subcategory_name)}`}
          className="block group cursor-pointer text-start font-tajawal"
        >
          {children}
        </Link>
      );
    }
    return <div className="text-start font-tajawal">{children}</div>;
  };

  return (
    <ContentWrapper>
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-2xl transition-all duration-300 bg-gradient-to-r ${theme.gradientClass} ${theme.borderClass} ${
          banner.is_active === false ? 'opacity-50 grayscale' : ''
        } p-4 sm:p-6 md:p-7 ${className} animate-banner-flying-angle`}
        dir="rtl"
        style={{
          boxShadow: `0 20px 40px -12px ${theme.glowColor}, 0 0 15px rgba(0,0,0,0.18)`,
        }}
      >

        {/* Ambient Glow Background Overlays */}
        <div className={`absolute -right-20 -top-20 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-2xl sm:blur-3xl bg-gradient-to-br ${theme.radialHighlight} pointer-events-none opacity-80 animate-pulse`} />
        <div className="absolute -left-16 -bottom-16 w-56 sm:w-80 h-56 sm:h-80 rounded-full blur-2xl sm:blur-3xl bg-white/10 pointer-events-none" />
        <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-banner-gloss pointer-events-none z-0" />
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />

        {/* Card Content Layout (Always Side-by-Side Flex-Row) */}
        <div className="relative z-10 flex flex-row items-center justify-between gap-3 sm:gap-6 md:gap-8">
          
          {/* Right Side (RTL): Title, Badges & CTA */}
          <div className="flex-1 space-y-2 sm:space-y-3 text-right min-w-0">
            
            {/* Header Badges Row (Subcategory Tag + Discount Percentage) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-black/40 text-amber-300 border border-white/20 backdrop-blur-md shadow-sm whitespace-nowrap max-w-[170px] sm:max-w-[240px]">
                <svg className="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="truncate">{banner.subcategory_name || 'قسم المنتجات'}</span>
              </span>

              {pctNum > 0 && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-on-surface px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs shadow-md shadow-amber-500/20 border border-amber-200 whitespace-nowrap">
                  <span>خصم %{pctNum}</span>
                </span>
              )}

              {banner.discount_badge && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold border backdrop-blur-md shadow-sm animate-pulse whitespace-nowrap ${theme.badgeClass}`}>
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                  </svg>
                  {banner.discount_badge}
                </span>
              )}
            </div>

            {/* Main Headline Title & Subtitle */}
            <div className="space-y-1">
              <h2
                className={`font-cairo font-extrabold text-white leading-snug tracking-wide ${
                  isCompact ? 'text-sm sm:text-lg' : 'text-base sm:text-xl md:text-2xl'
                }`}
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
              >
                {banner.title || 'عرض خاص ومميز'}
              </h2>

              {banner.subtitle && (
                <p className="font-tajawal font-medium text-white/90 text-xs sm:text-sm leading-relaxed line-clamp-2">
                  {banner.subtitle}
                </p>
              )}
            </div>

            {/* Bottom Offer Callout Line */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-200 font-bold pt-0.5 whitespace-nowrap">
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>خصم تلقائي مباشر بالسلة</span>
            </div>

          </div>

          {/* Left Side (RTL): Isolated Memoized 3D Product Image Fan Trio */}
          <BannerImageFan imagePool={imagePool} bannerTitle={banner.title} />

        </div>
      </div>
    </ContentWrapper>
  );
});
