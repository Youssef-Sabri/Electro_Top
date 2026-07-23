'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { Toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/format';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, onOpenDetails, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const isAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    };
  }, []);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stock <= 0) return;
    
    const hasColorVariants = Boolean(product.has_colors && Array.isArray(product.colors) && product.colors.length > 0);
    if (hasColorVariants) {
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
  }, [product, onOpenDetails, addToCart]);

  const isOutOfStock = product.stock <= 0;

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-outline-variant/20 overflow-hidden premium-shadow hover:premium-shadow-lg hover:-translate-y-1.5 active:scale-[0.98] premium-transition flex flex-col animate-fade-in-up opacity-0 relative"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      {/* Image Area */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-white">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="w-full h-full object-contain p-2 group-hover:scale-105 premium-transition pointer-events-none select-none"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={80}
            priority={index < 4}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 select-none border-b border-outline-variant/10">
            <svg className="w-10 h-10 mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-tajawal text-[11px] font-bold">لا توجد صورة</span>
          </div>
        )}

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-3.5 start-3.5 z-10 bg-surface-container border border-outline-variant/50 text-on-surface-variant text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none max-w-[60%] truncate">
            {product.category}
          </span>
        )}

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
            <span className="bg-primary text-on-primary font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm">
              نفذت الكمية
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-grow text-start font-tajawal border-t border-outline-variant/20 bg-white">
        <h3 className="font-bold text-[15px] text-on-surface mb-1.5 line-clamp-2 leading-snug hover:text-primary transition-colors">
          {product.name}
        </h3>

        <p className="text-on-surface-variant text-xs mb-4 line-clamp-2 min-h-[32px] leading-relaxed">
          {product.description}
        </p>

        {/* Price & Cart button */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
          <span className="text-primary font-bold text-[17px] tabular-nums font-mono tracking-tight">
            {formatCurrency(product.price)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              isOutOfStock
                ? 'bg-surface-container-low text-on-surface-variant/40 border-outline-variant/30 cursor-not-allowed'
                : isAdded
                  ? 'bg-[var(--color-status-delivered)] text-white border-[var(--color-status-delivered)]'
                  : 'bg-primary text-on-primary border-transparent hover:bg-primary-container hover:shadow-md active:scale-[0.92]'
            }`}
            aria-label="إضافة إلى السلة"
          >
            <span className="material-symbols-outlined text-[20px] select-none">
              {isAdded ? 'check' : 'add_shopping_cart'}
            </span>
          </button>
        </div>
      </div>

      {showToast && (
        <Toast
          message={`تم إضافة ${product.name} إلى السلة ✓`}
          type="success"
          onClose={handleCloseToast}
          duration={2000}
        />
      )}
    </Link>
  );
});
ProductCard.displayName = 'ProductCard';
