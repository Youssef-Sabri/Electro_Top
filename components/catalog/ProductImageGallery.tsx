'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isOutOfStock: boolean;
}

export function ProductImageGallery({ images, productName, isOutOfStock }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerStartX.current === null || images.length < 2) return;
      const diffX = pointerStartX.current - e.clientX;
      if (diffX > 50) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (diffX < -50) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
      pointerStartX.current = null;
    },
    [images.length]
  );

  if (images.length === 0) {
    return (
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[64px] text-outline-variant">image_not_supported</span>
        <span className="text-sm mt-2">لا توجد صورة</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-neutral-200/60 shadow-sm touch-pan-y cursor-grab active:cursor-grabbing select-none"
      >
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition active:scale-95 shadow flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100"
              aria-label="الصورة السابقة"
            >
              <span className="material-symbols-outlined text-[20px] select-none">chevron_left</span>
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition active:scale-95 shadow flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100"
              aria-label="الصورة التالية"
            >
              <span className="material-symbols-outlined text-[20px] select-none">chevron_right</span>
            </button>
          </>
        )}

        <Image
          key={images[currentIndex]}
          src={images[currentIndex]}
          alt={`${productName} - صورة ${currentIndex + 1}`}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          quality={70}
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
            <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm">
              نفذت الكمية
            </span>
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-black/40 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-surface-container-low transition-all duration-200 cursor-pointer flex-shrink-0 ${
                i === currentIndex
                  ? 'border-primary ring-1 ring-primary/30 scale-105 shadow-sm'
                  : 'border-outline-variant/30 hover:border-outline opacity-70 hover:opacity-100'
              }`}
              aria-label={`عرض الصورة ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${productName} - مصغرة ${i + 1}`}
                fill
                className="object-contain p-1"
                sizes="80px"
                quality={60}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
