'use client';

import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils/format';
import { ALL_COLORS, getColorHex } from '@/lib/utils/color';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailsModal = memo(function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const isAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    setSelectedColor(null);
    setQuantity(1);
    setCurrentImageIndex(0);
  }, [product]);

  const images = useMemo(() => {
    return [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];
  }, [product.image_url, product.image_url_2, product.image_url_3]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const pointerStartX = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const diffX = pointerStartX.current - e.clientX;
    const minDistance = 40;
    if (diffX > minDistance) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else if (diffX < -minDistance) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    pointerStartX.current = null;
  }, [images.length]);

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
    if (product.has_colors && selectedColor === null) return;
    addToCart(product, quantity, selectedColor);
    setIsAdded(true);
    if (isAddedTimerRef.current) clearTimeout(isAddedTimerRef.current);
    isAddedTimerRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const totalPrice = product.price * quantity;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] md:h-[500px] border border-outline-variant/10"
        style={{ animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-50 flex items-center justify-center w-9 h-9 bg-surface-container-low/80 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface backdrop-blur-md rounded-full border border-outline-variant/30 shadow-sm transition-all duration-300 hover:rotate-90 active:scale-90 cursor-pointer"
          aria-label="إغلاق النافذة"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative w-full md:w-5/12 h-[310px] md:h-full bg-white flex-shrink-0 border-e border-outline-variant/10 flex flex-col p-5 justify-between">
          <div className="relative w-full flex-grow h-[180px] md:h-[350px]">
            {images.length === 0 ? (
              <div className="w-full h-full bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 select-none">
                <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-tajawal text-sm font-bold">لا توجد صورة للمنتج</span>
              </div>
            ) : images.length > 1 ? (
              <div
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                className="relative w-full h-full group touch-pan-y cursor-grab active:cursor-grabbing select-none"
              >
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      key={images[currentImageIndex]}
                      src={images[currentImageIndex]}
                      alt={`${product.name} - ${currentImageIndex + 1}`}
                      fill
                      className="object-contain select-none"
                      sizes="(max-width: 768px) 100vw, 40vw"
                      quality={85}
                      priority
                      draggable={false}
                      unoptimized
                    />
                  </div>

                <button
                  onClick={handlePrevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-black/15 hover:bg-black/35 text-white rounded-full p-1.5 transition active:scale-95 shadow flex items-center justify-center opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-black/15 hover:bg-black/35 text-white rounded-full p-1.5 transition active:scale-95 shadow flex items-center justify-center opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain select-none"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  quality={85}
                  priority
                  draggable={false}
                  unoptimized
                />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 justify-center mt-3 overflow-x-auto py-1 w-full select-none scrollbar-hide flex-shrink-0">
              {images.map((imgUrl, index) => {
                const isActive = index === currentImageIndex;
                return (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-11 h-11 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer bg-white flex-shrink-0 ${
                      isActive ? 'border-primary ring-1 ring-primary/40 scale-105 shadow-sm' : 'border-outline-variant/30 hover:border-outline'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`عرض مصغر ${index + 1}`}
                      fill
                      className="object-contain p-0.5"
                      sizes="44px"
                      quality={60}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px] z-30">
              <span className="bg-[#CA202B] text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow-md">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>
 
        <div className="p-6 flex flex-col flex-grow overflow-y-auto h-[calc(85vh-260px)] md:h-full text-start font-tajawal bg-white">
          <div className="mb-4">
            <h2 className="font-bold text-[20px] md:text-[22px] text-on-surface leading-snug md:pl-16">
              {product.name}
            </h2>
          </div>
 
          <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
            <span className="text-primary font-bold text-2xl">
              {formatCurrency(product.price)}
            </span>
            {product.stock > 0 ? (
              <span className="bg-[var(--color-status-delivered)]/10 text-[var(--color-status-delivered)] text-xs font-semibold px-2.5 py-1 rounded-md border border-[var(--color-status-delivered)]/20">
                متوفر في المخزون: {product.stock}
              </span>
            ) : (
              <span className="bg-error/10 text-error text-xs font-semibold px-2.5 py-1 rounded-md border border-error/20">
                نفذت الكمية
              </span>
            )}
          </div>

          {product.has_colors && (
            <div className="mb-5 border-t border-b border-outline-variant/10 py-3.5 select-none text-start">
              <h3 className="font-bold text-on-surface text-[13px] mb-3 flex items-center gap-1.5">
                <span>اللون:</span>
                <span className="text-primary font-extrabold">{selectedColor || 'كل الألوان'}</span>
                <span className="text-primary font-bold">*</span>
              </h3>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedColor(null)}
                  className={`w-8 h-8 rounded-full border premium-transition cursor-pointer flex items-center justify-center bg-surface-container-low ${
                    selectedColor === null
                      ? 'border-primary ring-2 ring-offset-2 ring-primary/40 scale-105 shadow-sm'
                      : 'border-outline-variant/30 hover:border-outline hover:scale-105'
                  }`}
                  title="كل الألوان"
                  aria-label="كل الألوان"
                >
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60 select-none">palette</span>
                </button>
                {(product.colors && product.colors.length > 0 ? product.colors : ALL_COLORS.map(c => c.name)).map((colorName) => {
                  const hex = getColorHex(colorName);
                  const isSelected = selectedColor === colorName;
                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setSelectedColor(colorName)}
                      className={`w-8 h-8 rounded-full border premium-transition cursor-pointer relative flex items-center justify-center ${
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
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-on-surface-variant/50 text-xs uppercase tracking-wider mb-2">
              نظرة عامة
            </h3>
            <div className="text-on-surface-variant text-sm leading-relaxed space-y-2">
              {product.description.split('\n').map((para, i) =>
                para.trim() ? (
                  <p key={i}>{para.trim()}</p>
                ) : null
              )}
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-4 items-stretch">
            {product.stock > 0 && (
              <div className="flex items-center border border-outline-variant/20 rounded-xl overflow-hidden shrink-0 bg-surface-container-low justify-between h-[48px] px-2.5 premium-transition">
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
              disabled={product.stock <= 0 || (product.has_colors && selectedColor === null)}
              className={`flex-grow h-[48px] rounded-xl font-semibold transition-all duration-300 flex items-center justify-between px-6 cursor-pointer shadow-sm ${
                product.stock <= 0 || (product.has_colors && selectedColor === null)
                  ? 'bg-surface-container-low text-on-surface-variant/50 cursor-not-allowed shadow-none'
                  : isAdded
                    ? 'bg-[var(--color-status-delivered)] text-white hover:bg-[var(--color-status-delivered)]/90'
                    : 'bg-[#CA202B] hover:bg-[#b01b24] text-white active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] select-none">
                  {isAdded ? 'check_circle' : 'shopping_cart'}
                </span>
                <span>
                  {product.stock <= 0 ? 'نفذت الكمية' : isAdded ? 'تمت الإضافة' : 'إضافة للسلة'}
                </span>
              </div>
              
              {product.stock > 0 && !isAdded && (
                <span className="font-mono text-sm border-s border-white/20 ps-3.5">
                  {formatCurrency(totalPrice)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
ProductDetailsModal.displayName = 'ProductDetailsModal';
