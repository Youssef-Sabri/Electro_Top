'use client';

import { memo, useMemo } from 'react';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { Modal } from '@/components/ui/Modal';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import { ProductDetailActions } from '@/components/catalog/ProductDetailActions';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailsModal = memo(function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const images = useMemo(() => {
    return [product.image_url, product.image_url_2, product.image_url_3].filter(
      (img): img is string => !!img
    );
  }, [product.image_url, product.image_url_2, product.image_url_3]);

  return (
    <Modal isOpen={true} onClose={onClose} title={product.name}>
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-[520px] border border-outline-variant/10"
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

        {/* Left Side: Images */}
        <div className="w-full md:w-5/12 bg-white flex-shrink-0 border-e border-outline-variant/10 p-5 flex flex-col justify-center">
          <ProductImageGallery
            images={images}
            productName={product.name}
            isOutOfStock={product.stock <= 0}
          />
        </div>

        {/* Right Side: Product Details */}
        <div className="p-6 flex flex-col flex-grow overflow-y-auto h-auto md:h-full text-start font-tajawal bg-white">
          <div className="mb-3 sm:mb-4">
            {product.category && (
              <span className="inline-block bg-surface-container border border-outline-variant/50 text-on-surface-variant text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit mb-3">
                {product.category}
              </span>
            )}
            <h2 className="font-bold text-base sm:text-lg md:text-xl text-on-surface leading-snug md:pl-16">
              {product.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5 text-sm">
            <span className="text-primary font-bold text-lg sm:text-xl md:text-2xl">
              {formatCurrency(product.price)}
            </span>
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-on-surface text-xs mb-2">الوصف</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <div className="mt-auto">
            <ProductDetailActions product={product} />
          </div>
        </div>
      </div>
    </Modal>
  );
});
ProductDetailsModal.displayName = 'ProductDetailsModal';
