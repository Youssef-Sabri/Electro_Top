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
  /** Fallback image URL from subcategory products if banner.image_url is not set */
  fallbackImageUrl?: string | null;
  /** Array of product images belonging to this subcategory for dynamic random rotation */
  categoryImages?: string[];
  /** Disable link action (e.g. inside form preview) */
  interactiveLink?: boolean;
  /** Size variant */
  variant?: 'full' | 'compact';
  /** Extra wrapper classes */
  className?: string;
  /** Optional onClick callback for CTA */
  onCtaClick?: () => void;
}

export const SubcategoryBannerCard = memo(function SubcategoryBannerCard({
  banner,
  fallbackImageUrl,
  categoryImages,
  interactiveLink = false,
  variant = 'full',
  className = '',
  onCtaClick,
}: SubcategoryBannerCardProps) {
  const theme = getBannerTheme(banner.banner_color);
  const pctNum = banner.discount_percentage ? Number(banner.discount_percentage) : 0;
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

  const [activeBaseIndex, setActiveBaseIndex] = useState(0);

  // Dynamic image rotation every 3.5 seconds
  useEffect(() => {
    if (imagePool.length <= 1) {
      setActiveBaseIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setActiveBaseIndex((prev) => (prev + 1) % imagePool.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [imagePool]);

  // Compute 3 distinct images for the 3 slots so no slot shows the same image at the same time
  const slotImages = useMemo(() => {
    const total = imagePool.length;
    if (total === 0) return [null, null, null];
    if (total === 1) return [imagePool[0], null, null];
    if (total === 2) return [imagePool[activeBaseIndex % 2], imagePool[(activeBaseIndex + 1) % 2], null];

    // For 3 or more images: 3 guaranteed distinct images simultaneously!
    const slot0 = imagePool[activeBaseIndex % total];
    const slot1 = imagePool[(activeBaseIndex + 1) % total];
    const slot2 = imagePool[(activeBaseIndex + 2) % total];
    return [slot0, slot1, slot2];
  }, [imagePool, activeBaseIndex]);

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
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-500 bg-gradient-to-r ${theme.gradientClass} ${theme.borderClass} ${
          banner.is_active === false ? 'opacity-50 grayscale' : ''
        } ${isCompact ? 'p-3 sm:p-4 md:p-5' : 'p-3.5 sm:p-6 md:p-8'} ${className}`}
        dir="rtl"
        style={{
          boxShadow: `0 15px 35px -10px ${theme.glowColor}, 0 0 10px rgba(0,0,0,0.15)`,
        }}
      >
        {/* ── Background Overlays ── */}
        <div
          className={`absolute -right-20 -top-20 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-2xl sm:blur-3xl bg-gradient-to-br ${theme.radialHighlight} pointer-events-none opacity-80 animate-pulse`}
        />
        <div className="absolute -left-16 -bottom-16 w-56 sm:w-80 h-56 sm:h-80 rounded-full blur-2xl sm:blur-3xl bg-white/10 pointer-events-none" />
        <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-banner-gloss pointer-events-none z-0" />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"
        />
        <div className="absolute left-1/3 -top-12 -bottom-12 w-48 bg-gradient-to-r from-white/5 to-transparent skew-x-[-25deg] pointer-events-none hidden sm:block" />

        {/* ── Main Banner Content Layout (Always Side-by-Side Flex-Row) ── */}
        <div className="relative z-10 flex flex-row items-center justify-between gap-2.5 sm:gap-5 md:gap-8">
          
          {/* Right Side (RTL): Copy & CTA */}
          <div className="flex-1 space-y-1.5 sm:space-y-3 text-right min-w-0">
            
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold bg-black/40 text-white backdrop-blur-md border border-white/15 shadow-sm truncate max-w-[140px] sm:max-w-none">
                <span className="material-symbols-outlined text-[11px] sm:text-sm text-yellow-400 select-none shrink-0">folder</span>
                <span className="truncate">{banner.subcategory_name || 'قسم المنتجات'}</span>
              </span>

              {banner.discount_badge && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-extrabold border backdrop-blur-md shadow-sm animate-pulse ${theme.badgeClass}`}>
                  <span className="material-symbols-outlined text-[9px] sm:text-xs select-none">bolt</span>
                  {banner.discount_badge}
                </span>
              )}
            </div>

            {/* Headline Title & Subtitle */}
            <div className="space-y-0.5">
              <h2
                className={`font-black text-white leading-tight tracking-tight line-clamp-2 ${
                  isCompact ? 'text-xs sm:text-lg md:text-xl' : 'text-sm sm:text-xl md:text-3xl lg:text-4xl'
                }`}
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                {banner.title || 'عرض خاص ومميز'}
              </h2>

              {banner.subtitle && (
                <p
                  className={`font-medium text-white/85 leading-snug line-clamp-1 sm:line-clamp-2 ${
                    isCompact ? 'text-[10px] sm:text-xs' : 'text-[10px] sm:text-xs md:text-base max-w-xl'
                  }`}
                >
                  {banner.subtitle}
                </p>
              )}
            </div>

            {/* Discount Sticker Row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 pt-0.5">
              {pctNum > 0 && (
                <div className={`px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-2xl ${theme.accentBadge} transform -rotate-1 hover:rotate-0 transition-transform duration-300 flex items-center gap-1 shadow-md`}>
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-80">خصم</span>
                  <span className="text-sm sm:text-2xl md:text-3xl font-black leading-none">{pctNum}%</span>
                </div>
              )}

              <span className="text-[10px] sm:text-xs text-white/80 font-medium bg-black/25 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-sm hidden sm:inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-xs sm:text-sm text-emerald-400 select-none">verified</span>
                خصم مباشر بالسلة
              </span>
            </div>

          </div>

          {/* Left Side (RTL): 3 Floating Staggered Product Cards Trio */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center -space-x-3.5 sm:-space-x-6 md:-space-x-8 rtl:space-x-reverse py-1">
              
              {/* Card 0 (Left Card) */}
              <div
                className={`relative group/card transform -rotate-6 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-500 animate-banner-float z-10 ${
                  isCompact ? 'w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24' : 'w-14 h-14 sm:w-24 sm:h-24 md:w-36 md:h-36'
                }`}
                style={{ animationDelay: '0s' }}
              >
                <div className="absolute -inset-1 rounded-xl bg-white/20 blur-sm sm:blur-md opacity-50 group-hover/card:opacity-90 transition-opacity" />
                <div className="relative w-full h-full rounded-lg sm:rounded-xl border border-white/30 bg-white/20 backdrop-blur-md p-1 sm:p-1.5 shadow-lg overflow-hidden">
                  {slotImages[0] ? (
                    <div className="relative w-full h-full rounded sm:rounded-lg overflow-hidden bg-white/95">
                      <Image
                        key={slotImages[0]}
                        src={slotImages[0]}
                        alt={banner.title}
                        fill
                        sizes="(max-width: 640px) 56px, 144px"
                        className="object-contain p-0.5 sm:p-1 animate-[fadeInScale_0.4s_ease-out]"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded sm:rounded-lg bg-gradient-to-br from-black/40 to-white/10 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-xs sm:text-xl text-yellow-300">electrical_services</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 1 (Center Elevated Card - Highlighted) */}
              <div
                className={`relative group/card transform rotate-0 hover:scale-115 hover:z-30 transition-all duration-500 animate-banner-float z-20 ${
                  isCompact ? 'w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28' : 'w-18 h-18 sm:w-28 sm:h-28 md:w-40 md:h-40'
                }`}
                style={{ animationDelay: '0.6s' }}
              >
                <div className="absolute -inset-1 sm:-inset-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400/40 to-white/30 blur-sm sm:blur-lg opacity-70 group-hover/card:opacity-100 transition-opacity" />
                <div className="relative w-full h-full rounded-lg sm:rounded-xl border-2 border-white/40 bg-white/25 backdrop-blur-md p-1 sm:p-2 shadow-2xl overflow-hidden">
                  {slotImages[1] || slotImages[0] ? (
                    <div className="relative w-full h-full rounded sm:rounded-lg overflow-hidden bg-white/95">
                      <Image
                        key={slotImages[1] || slotImages[0]}
                        src={(slotImages[1] || slotImages[0])!}
                        alt={banner.title}
                        fill
                        sizes="(max-width: 640px) 72px, 160px"
                        className="object-contain p-0.5 sm:p-1 animate-[fadeInScale_0.4s_ease-out]"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded sm:rounded-lg bg-gradient-to-br from-black/40 to-white/10 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-sm sm:text-2xl text-yellow-300">bolt</span>
                    </div>
                  )}

                  {/* Percentage Tag on Main Center Card */}
                  {pctNum > 0 && (
                    <div className="absolute top-0.5 left-0.5 bg-red-600 text-white font-black text-[8px] sm:text-[10px] px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded shadow border border-red-400/40 z-30">
                      -{pctNum}%
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2 (Right Card) */}
              <div
                className={`relative group/card transform rotate-6 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-500 animate-banner-float z-10 ${
                  isCompact ? 'w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24' : 'w-14 h-14 sm:w-24 sm:h-24 md:w-36 md:h-36'
                }`}
                style={{ animationDelay: '1.2s' }}
              >
                <div className="absolute -inset-1 rounded-xl bg-white/20 blur-sm sm:blur-md opacity-50 group-hover/card:opacity-90 transition-opacity" />
                <div className="relative w-full h-full rounded-lg sm:rounded-xl border border-white/30 bg-white/20 backdrop-blur-md p-1 sm:p-1.5 shadow-xl overflow-hidden">
                  {slotImages[2] || slotImages[0] ? (
                    <div className="relative w-full h-full rounded sm:rounded-lg overflow-hidden bg-white/95">
                      <Image
                        key={slotImages[2] || slotImages[0]}
                        src={(slotImages[2] || slotImages[0])!}
                        alt={banner.title}
                        fill
                        sizes="(max-width: 640px) 56px, 144px"
                        className="object-contain p-0.5 sm:p-1 animate-[fadeInScale_0.4s_ease-out]"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded sm:rounded-lg bg-gradient-to-br from-black/40 to-white/10 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-xs sm:text-xl text-yellow-300">verified</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </ContentWrapper>
  );
});
