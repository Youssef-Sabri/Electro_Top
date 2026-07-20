'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils/format';
import { Toast } from '@/components/ui/Toast';
import { getColorHex } from '@/lib/utils/color';

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleCloseToast = useCallback(() => setShowToast(false), []);

  useEffect(() => {
    return () => {
      if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    };
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity((q) => Math.min(q + 1, product.stock));
  }, [product.stock]);

  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (product.stock <= 0) return;
    if (product.has_colors && selectedColor === null) return;
    addToCart(product, quantity, selectedColor);
    setIsAdded(true);
    setShowToast(true);
    if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    isAddedTimerRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  }, [product, quantity, selectedColor, addToCart]);

  const isOutOfStock = product.stock <= 0;
  const isDisabled = isOutOfStock || (product.has_colors && selectedColor === null);
  const totalPrice = product.price * quantity;

  return (
    <div className="space-y-5">
      {/* Colors */}
      {product.has_colors && product.colors && product.colors.length > 0 && (
        <div>
          <h2 className="font-bold text-sm text-on-surface mb-3">الألوان المتاحة</h2>
          <div className="flex flex-wrap gap-2">
            {product.colors.map(
              (colorName) => {
                const hex = getColorHex(colorName);
                const isSelected = selectedColor === colorName;
                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setSelectedColor(colorName)}
                    className={`w-9 h-9 rounded-full border-2 premium-transition cursor-pointer relative flex items-center justify-center ${
                      isSelected
                        ? 'border-primary ring-2 ring-offset-2 ring-primary/40 scale-105 shadow-sm'
                        : 'border-outline-variant/30 hover:border-outline hover:scale-105'
                    }`}
                    title={colorName}
                    aria-label={`اختر لون ${colorName}`}
                  >
                    <span
                      className="absolute inset-0.5 rounded-full border border-black/5"
                      style={{ background: hex }}
                    />
                  </button>
                );
              }
            )}
          </div>
          {product.has_colors && selectedColor === null && (
            <p className="text-xs text-primary font-medium mt-2">* اختر لوناً أولاً</p>
          )}
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch pt-5 border-t border-outline-variant/20">
        {!isOutOfStock && (
          <div className="flex items-center border border-outline-variant/20 rounded-xl overflow-hidden shrink-0 bg-surface-container-low justify-between h-12 px-2.5">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="p-1 hover:bg-white rounded premium-transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="تقليل الكمية"
            >
              <span className="material-symbols-outlined text-[20px] select-none">remove</span>
            </button>
            <span className="w-10 text-center font-bold text-on-surface">{quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stock}
              className="p-1 hover:bg-white rounded premium-transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="زيادة الكمية"
            >
              <span className="material-symbols-outlined text-[20px] select-none">add</span>
            </button>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isDisabled}
          className={`flex-grow h-12 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            isDisabled
              ? 'bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed shadow-none'
              : isAdded
                ? 'bg-[var(--color-status-delivered)] text-white hover:bg-[var(--color-status-delivered)]/90'
                : 'bg-primary hover:bg-primary-container text-on-primary active:scale-[0.98]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] select-none">
            {isAdded ? 'check_circle' : 'add_shopping_cart'}
          </span>
          <span>
            {isOutOfStock
              ? 'نفذت الكمية'
              : isAdded
                ? 'تمت الإضافة ✓'
                : 'إضافة إلى السلة'}
          </span>
          {!isOutOfStock && !isAdded && (
            <span className="text-xs opacity-80 border-e border-white/20 pe-2 me-1">
              {formatCurrency(totalPrice)}
            </span>
          )}
        </button>
      </div>

      {/* Stock badge */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span
          className={`text-sm font-bold ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}
        >
          {product.stock > 0 ? `متوفر (${product.stock} قطعة)` : 'غير متوفر حالياً'}
        </span>
      </div>

      {showToast && (
        <Toast
          message={`تم إضافة ${product.name} إلى السلة ✓`}
          type="success"
          onClose={handleCloseToast}
          duration={2000}
        />
      )}
    </div>
  );
}
