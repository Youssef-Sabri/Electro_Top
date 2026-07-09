'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import type { CartItem as CartItemType } from '@/types';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/format-currency';
import { getColorHex } from '@/lib/color-palette';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = memo(function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const handleDecrease = useCallback(() => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1, item.selectedColor);
    }
  }, [quantity, product.id, item.selectedColor, updateQuantity]);

  const handleIncrease = useCallback(() => {
    if (quantity < product.stock) {
      updateQuantity(product.id, quantity + 1, item.selectedColor);
    }
  }, [quantity, product.stock, product.id, item.selectedColor, updateQuantity]);

  const handleRemove = useCallback(() => {
    removeFromCart(product.id, item.selectedColor);
  }, [product.id, item.selectedColor, removeFromCart]);

  return (
    <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-center shadow-sm hover:shadow-md transition-shadow duration-300">
      
      {/* Product Image */}
      <div className="w-28 h-28 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-outline-variant/30 relative">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-contain p-2 bg-white pointer-events-none select-none"
          sizes="112px"
          quality={75}
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* Item Info */}
      <div className="flex-grow flex flex-col w-full text-start">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-bold text-[16px] text-on-background uppercase tracking-tight">
              {product.name}
            </h3>
            {item.selectedColor && (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/40 text-on-surface-variant text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit">
                <span className="w-2 h-2 rounded-full border border-outline-variant" style={{
                  background: getColorHex(item.selectedColor)
                }} />
                اللون: {item.selectedColor}
              </span>
            )}
          </div>
          <p className="font-bold text-primary text-end shrink-0 text-base">
            {formatCurrency(product.price)}
          </p>
        </div>

        {/* Action controls */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-outline-variant/20">
          <div className="flex items-center border border-outline-variant/40 rounded-lg p-1 bg-surface-container-low select-none">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="w-7 h-7 hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center text-on-surface-variant"
              aria-label="تقليل الكمية"
            >
              <span className="material-symbols-outlined text-[18px] select-none">remove</span>
            </button>
            <span className="px-3 font-bold text-on-surface text-sm min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={quantity >= product.stock}
              className="w-7 h-7 hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center text-on-surface-variant"
              aria-label="زيادة الكمية"
            >
              <span className="material-symbols-outlined text-[18px] select-none">add</span>
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-bold text-xs cursor-pointer"
            aria-label="حذف المنتج"
          >
            <span className="material-symbols-outlined text-[16px] select-none">delete</span>
            حذف
          </button>
        </div>
      </div>
    </div>
  );
});
CartItem.displayName = 'CartItem';
