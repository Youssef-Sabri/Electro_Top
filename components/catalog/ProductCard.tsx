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
      className="group bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer animate-fade-in-up opacity-0 relative"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      {/* Image Area */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-white">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={80}
          priority={index < 4}
          draggable={false}
        />

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
          <span className="text-primary font-bold text-[17px]">
            {formatCurrency(product.price)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-9 h-9 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 border cursor-pointer ${
              isOutOfStock
                ? 'bg-surface-container-low text-on-surface-variant/40 border-outline-variant/30 cursor-not-allowed'
                : isAdded
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-primary text-on-primary border-transparent hover:bg-primary-container hover:shadow-md'
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
          onClose={() => setShowToast(false)}
          duration={2000}
        />
      )}
    </div>
  );
});
ProductCard.displayName = 'ProductCard';
