'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { SubcategoryBannerCard } from '@/components/catalog/SubcategoryBannerCard';
import type { SubcategoryBanner } from '@/types';

interface HeroDiscountBannerRotatorProps {
  banners: SubcategoryBanner[];
  subcategoryImagesMap?: Map<string, string[]>;
}

export const HeroDiscountBannerRotator = memo(function HeroDiscountBannerRotator({
  banners,
  subcategoryImagesMap,
}: HeroDiscountBannerRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const indexRef = useRef(0);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the slide when the banner list changes
  useEffect(() => {
    indexRef.current = 0;
    setCurrentIndex(0);
    setIsFading(false);
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, [banners]);

  // Clear any pending fade timer on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const goToSlide = useCallback(
    (idx: number) => {
      if (banners.length === 0) return;
      const bounded = ((idx % banners.length) + banners.length) % banners.length;
      if (bounded === indexRef.current) return;
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      indexRef.current = bounded;
      setIsFading(true);
      fadeTimerRef.current = setTimeout(() => {
        setCurrentIndex(bounded);
        setIsFading(false);
        fadeTimerRef.current = null;
      }, 200);
    },
    [banners.length]
  );

  // Auto-rotate every 9 seconds if there are multiple active banners.
  // Restarts on every slide change so a manual selection is never instantly overridden.
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      goToSlide(indexRef.current + 1);
    }, 9000);

    return () => clearInterval(interval);
  }, [banners.length, isHovered, currentIndex, goToSlide]);

  if (banners.length === 0) return null;

  const activeBanner = banners[currentIndex % banners.length] || banners[0];
  const catImages = subcategoryImagesMap?.get(activeBanner.subcategory_name) || [];

  return (
    <div
      className="relative w-full group select-none max-w-xl mx-auto lg:max-w-none"
      onMouseEnter={() => setIsHovered(true)}
      aria-label="قسم العروض والخصومات المتميزة"
      onMouseLeave={() => setIsHovered(false)}
      dir="rtl"
    >
      {/* Decorative Glow Ambient Halo */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/30 via-electro-gold/25 to-primary/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Main Animated Card Wrapper */}
      <div
        className="relative z-10 transition-opacity duration-300 ease-out"
        style={{
          opacity: isFading ? 0.4 : 1,
        }}
      >
        <SubcategoryBannerCard
          banner={activeBanner}
          categoryImages={catImages}
          interactiveLink
          className="shadow-2xl hover:shadow-primary/20 border-white/20"
        />
      </div>

      {/* Controls Bar for Multiple Active Banners */}
      {banners.length > 1 && (
        <div className="mt-3.5 flex items-center justify-between px-2 text-white/80">
          
          {/* Active Banner Counter */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-mono">
            <span className="text-electro-gold">{currentIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span>{banners.length}</span>
            <span className="text-[10px] text-white/70 font-sans mr-1">عروض نشطة</span>
          </div>

          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {banners.map((b, idx) => (
              <button
                key={b.id || idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`الانتقال إلى العرض ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-electro-gold shadow-md shadow-electro-gold/50'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Navigation SVG Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToSlide(indexRef.current - 1)}
              aria-label="العرض السابق"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goToSlide(indexRef.current + 1)}
              aria-label="العرض التالي"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

        </div>
      )}
    </div>
  );
});
