'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/format-currency';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}


export const ProductDetailsModal = memo(function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const isAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleIncrement = useCallback(() => {
    setQuantity((q) => Math.min(q + 1, product.stock));
  }, [product.stock]);

  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity);
    setIsAdded(true);
    if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    isAddedTimerRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-[500px] border border-outline-variant/20"
        style={{ animation: 'modalAppear 0.2s ease-out forwards' }}
      >
        <div className="relative w-full md:w-5/12 h-[220px] md:h-full bg-white flex-shrink-0 border-e border-outline-variant/10">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-4 pointer-events-none select-none"
            sizes="(max-width: 768px) 100vw, 40vw"
            quality={85}
            priority
            draggable={false}
          />
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
              <span className="bg-electro-red text-white font-tajawal font-bold px-6 py-2.5 rounded-md uppercase tracking-wider text-sm shadow-md">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>
 
        <div className="p-6 flex flex-col flex-grow overflow-y-auto h-[calc(90vh-220px)] md:h-full text-start font-tajawal">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-headline-md text-[20px] md:text-[22px] text-on-surface leading-tight font-bold">
                {product.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <span className="material-symbols-outlined text-[24px] select-none">close</span>
            </button>
          </div>
 
          <div className="flex items-center gap-4 mb-5">
            <span className="text-electro-gold font-bold text-[22px] md:text-[24px] font-tajawal">
              {formatCurrency(product.price)}
            </span>
            {product.stock > 0 ? (
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-green-200">
                متوفر في المخزون: {product.stock}
              </span>
            ) : (
              <span className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-red-200">
                نفذت الكمية
              </span>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-on-surface text-[12px] uppercase tracking-wider mb-2 font-tajawal">
              نظرة عامة
            </h3>
            <p className="text-on-surface-variant text-label-md leading-relaxed">
              {product.description}
            </p>
          </div>



          <div className="mt-auto pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row gap-4 items-stretch">
            {product.stock > 0 && (
              <div className="flex items-center border border-outline-variant/40 rounded-lg overflow-hidden shrink-0 bg-surface-container-lowest justify-between h-[48px] px-2">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-1 hover:bg-surface-container rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  aria-label="تقليل الكمية"
                >
                  <span className="material-symbols-outlined text-[20px] select-none">remove</span>
                </button>
                <span className="w-12 text-center font-bold text-on-surface font-tajawal">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= product.stock}
                  className="p-1 hover:bg-surface-container rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  aria-label="زيادة الكمية"
                >
                  <span className="material-symbols-outlined text-[20px] select-none">add</span>
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`flex-grow h-[48px] rounded-lg font-label-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                product.stock <= 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : isAdded
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-electro-red text-white hover:bg-brand-red-dark active:scale-[0.98]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] select-none">
                {isAdded ? 'check_circle' : 'shopping_cart'}
              </span>
              {product.stock <= 0 ? 'نفذت الكمية' : isAdded ? 'تمت الإضافة للسلة ✓' : `إضافة ${quantity} إلى السلة`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
