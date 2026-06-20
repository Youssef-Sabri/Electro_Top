'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '../../types';
import { useCart } from '../../hooks/useCart';
import { Toast } from '../ui/Toast';
import { formatCurrency } from '../../lib/format-currency';

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
      className="product-card group bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] active:shadow-md transition-all duration-300 flex flex-col cursor-pointer animate-fade-in-up opacity-0"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
       <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-white border-b border-outline-variant/10">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="w-full h-full object-contain p-2 group-hover:scale-105 group-active:scale-105 transition-transform duration-500 pointer-events-none select-none"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={80}
          priority={index < 4}
          draggable={false}
        />
        

         {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10">
            <span className="bg-electro-red text-white font-montserrat font-bold px-4 py-2 rounded-md uppercase tracking-wider text-xs shadow-md">
              نفذت الكمية
            </span>
          </div>
        )}
      </div>

       <div className="p-4 flex flex-col flex-grow text-start font-poppins">
        <h3 className="font-headline-md text-[16px] text-on-surface mb-1 truncate">
          {product.name}
        </h3>
        
        <p className="text-on-surface-variant text-label-sm mb-2 line-clamp-2 min-h-[32px] leading-relaxed">
          {product.description}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-electro-gold font-bold text-headline-md text-[16px]">
            {formatCurrency(product.price)}
          </span>
          
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`p-2 rounded-lg transition-colors shadow-md active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : isAdded
                  ? 'bg-green-600 text-white'
                  : 'bg-electro-red text-white hover:bg-primary-container'
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
