'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { Toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/format';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, onOpenDetails, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const isAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    };
  }, []);

  const hasColorVariants = Boolean(product.has_colors && Array.isArray(product.colors) && product.colors.length > 0);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stock <= 0) return;
    
    if (hasColorVariants) {
      if (onOpenDetails) {
        onOpenDetails(product);
      } else {
        router.push(`/products/${product.slug}`);
      }
      return;
    }
    
    addToCart(product, 1);
    setShowToast(true);
    setIsAdded(true);
    if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    isAddedTimerRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  }, [product, hasColorVariants, onOpenDetails, router, addToCart]);


  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm shadow-hover-glow hover:-translate-y-1.5 active:scale-[0.98] premium-transition flex flex-col animate-fade-in-up opacity-0 relative"
      style={{ animationDelay: `${(index % 8) * 50}ms` }}
    >
      {/* Image Container */}
      <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-white flex items-center justify-center p-3 border-b border-outline-variant/10">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="w-full h-full object-contain p-3 group-hover:scale-105 premium-transition pointer-events-none select-none"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={80}
            priority={index < 4}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-surface-container-low/50 flex flex-col items-center justify-center text-on-surface-variant/40 select-none">
            <span className="material-symbols-outlined text-[36px] mb-1">inventory_2</span>
            <span className="font-tajawal text-[11px] font-bold">إلكترو توب</span>
          </div>
        )}

        {/* Category tag */}
        {product.category && (
          <span className="absolute top-3 start-3 z-10 bg-white/90 backdrop-blur-md border border-outline-variant/30 text-on-surface text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none max-w-[65%] truncate shadow-xs">
            {product.category}
          </span>
        )}

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 end-3 z-10 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            نفذت الكمية
          </span>
        ) : isLowStock ? (
          <span className="absolute top-3 end-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            متبقي {product.stock} فقط
          </span>
        ) : null}

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
            <span className="bg-primary text-on-primary font-bold px-4 py-2 rounded-xl text-xs shadow-md">
              غير متوفر حالياً
            </span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-5 flex flex-col flex-grow text-start font-tajawal bg-white">
        <h3 className="font-bold text-[15px] text-on-surface mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <p className="text-on-surface-variant/75 text-xs mb-3 line-clamp-2 min-h-[32px] leading-relaxed">
          {product.description}
        </p>

        {/* Color variants preview if present */}
        {hasColorVariants && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] text-on-surface-variant/60 font-semibold me-1">الألوان:</span>
            <div className="flex items-center gap-1">
              {product.colors!.slice(0, 4).map((color, cIdx) => (
                <span
                  key={cIdx}
                  className="w-3 h-3 rounded-full border border-black/15 shadow-xs"
                  style={{
                    backgroundColor:
                      color.toLowerCase() === 'أحمر' || color.toLowerCase() === 'red' ? '#ef4444' :
                      color.toLowerCase() === 'أسود' || color.toLowerCase() === 'black' ? '#18181b' :
                      color.toLowerCase() === 'أزرق' || color.toLowerCase() === 'blue' ? '#3b82f6' :
                      color.toLowerCase() === 'أصفر' || color.toLowerCase() === 'yellow' ? '#eab308' :
                      color.toLowerCase() === 'أخضر' || color.toLowerCase() === 'green' ? '#22c55e' :
                      color.toLowerCase() === 'أبيض' || color.toLowerCase() === 'white' ? '#ffffff' : '#9ca3af'
                  }}
                  title={color}
                />
              ))}
              {product.colors!.length > 4 && (
                <span className="text-[9px] text-on-surface-variant/70 font-mono font-bold">
                  +{product.colors!.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bottom Price & Action Row */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/15">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant/60 font-semibold">السعر</span>
            <span className="text-primary font-bold text-[18px] tabular-nums font-mono tracking-tight">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`h-10 px-3.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 font-bold text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              isOutOfStock
                ? 'bg-surface-container text-on-surface-variant/40 border border-outline-variant/30 cursor-not-allowed'
                : isAdded
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-primary text-on-primary hover:bg-primary-container hover:shadow-md active:scale-[0.94]'
            }`}
            aria-label={hasColorVariants ? "اختيار اللون والإضافة" : "إضافة إلى السلة"}
          >
            <span className="material-symbols-outlined text-[18px] select-none">
              {isAdded ? 'check' : hasColorVariants ? 'palette' : 'add_shopping_cart'}
            </span>
            <span>{isAdded ? 'تم' : hasColorVariants ? 'اختر اللون' : 'إضافة'}</span>
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

