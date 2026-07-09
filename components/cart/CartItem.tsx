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
    <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center card-hover-lift shadow-sm">
      <div className="w-32 h-32 flex-shrink-0 bg-surface-container rounded-lg overflow-hidden border border-outline-variant/20 relative">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-contain p-2 bg-white pointer-events-none select-none"
          sizes="128px"
          quality={75}
          loading="lazy"
          draggable={false}
        />
      </div>

      <div className="flex-grow flex flex-col w-full text-start">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-headline-md text-[20px] text-on-background uppercase tracking-tight font-bold">
              {product.name}
            </h3>
            {item.selectedColor && (
              <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md w-fit">
                <span className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{
                  background: getColorHex(item.selectedColor)
                }} />
                اللون: {item.selectedColor}
              </span>
            )}
          </div>
          <p className="font-headline-md text-primary text-end shrink-0 font-bold">
            {formatCurrency(product.price)}
          </p>
        </div>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center border border-outline-variant rounded-lg p-1 bg-surface select-none">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="p-1 hover:text-primary transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center"
              aria-label="تقليل الكمية"
            >
              <span className="material-symbols-outlined text-[20px] select-none">remove</span>
            </button>
            <span className="px-4 font-bold text-on-surface text-sm">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={quantity >= product.stock}
              className="p-1 hover:text-primary transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center"
              aria-label="زيادة الكمية"
            >
              <span className="material-symbols-outlined text-[20px] select-none">add</span>
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="flex items-center gap-1 text-on-surface-variant hover:text-error transition-colors font-label-md cursor-pointer"
            aria-label="حذف المنتج"
          >
            <span className="material-symbols-outlined text-[18px] select-none">delete</span>
            حذف
          </button>
        </div>
      </div>
    </div>
  );
});
