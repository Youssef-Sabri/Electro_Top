'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { Toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/format-currency';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  index?: number;
}

export const ProductCard = React.memo(function ProductCard({ product, onOpenDetails, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const isAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    if (product.has_colors) {
      onOpenDetails(product);
      return;
    }
    addToCart(product, 1);
    setShowToast(true);
    setIsAdded(true);
    if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    isAddedTimerRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="product-card group bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.015] active:scale-[0.98] active:shadow-md transition-all duration-300 flex flex-col cursor-pointer animate-fade-in-up opacity-0"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      {/* Image area */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-white border-b border-outline-variant/10">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="w-full h-full object-contain p-3 group-hover:scale-108 group-active:scale-105 transition-transform duration-500 pointer-events-none select-none"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={80}
          priority={index < 4}
          draggable={false}
        />

        {/* Category badge — top-left */}
        {product.category && (
          <span className="absolute top-2.5 start-2.5 z-10 bg-on-background/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wide truncate max-w-[45%]">
            {product.category}
          </span>
        )}

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10">
            <span className="bg-electro-red text-white font-tajawal font-bold px-4 py-2 rounded-md uppercase tracking-wider text-xs shadow-md">
              نفذت الكمية
            </span>
          </div>
        )}

        {/* Hover overlay: "View details" hint */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none z-10">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-on-background/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              عرض التفاصيل
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-grow text-start font-tajawal">
        <h3 className="font-headline-md text-[15px] text-on-surface mb-1.5 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        <p className="text-on-surface-variant text-label-sm mb-3 line-clamp-2 min-h-[32px] leading-relaxed">
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-electro-gold font-bold text-[17px] leading-tight">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 shadow-md active:scale-95 cursor-pointer shrink-0 text-xs font-semibold ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : isAdded
                  ? 'bg-green-600 text-white'
                  : 'bg-electro-red text-white hover:bg-brand-red-dark'
            }`}
            aria-label="إضافة إلى السلة"
          >
            <span className="material-symbols-outlined text-[18px] select-none">
              {isAdded ? 'check' : 'add_shopping_cart'}
            </span>
            <span className="hidden sm:inline">
              {isAdded ? 'تمت الإضافة' : 'أضف للسلة'}
            </span>
          </button>
        </div>
      </div>

      {showToast && (
        <Toast
          message={`تم إضافة ${product.name} إلى السلة ✓`}
          type="success"
          onClose={() => setShowToast(false)}
          duration={2000}
        />
      )}
    </div>
  );
});
