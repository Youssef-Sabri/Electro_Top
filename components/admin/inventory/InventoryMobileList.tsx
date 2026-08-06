'use client';

import { memo } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import type { Product } from '@/types';

interface InventoryMobileListProps {
  isLoaded: boolean;
  products: Product[];
  onToggleActive: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const InventoryMobileList = memo(function InventoryMobileList({
  isLoaded,
  products,
  onToggleActive,
  onEdit,
  onDelete,
}: InventoryMobileListProps) {
  return (
    <div className="block lg:hidden divide-y divide-outline-variant/10">
      {!isLoaded ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <div key={`sk-card-${idx}`} className="p-4 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low/40 p-2.5 rounded-lg">
              <div className="space-y-1"><Skeleton className="h-3 w-8" /><Skeleton className="h-4 w-16" /></div>
              <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /></div>
            </div>
          </div>
        ))
      ) : products.length > 0 ? (
        products.map((product) => (
          <div key={product.id} className="p-4 space-y-4 hover:bg-surface-container-low/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-low shrink-0">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover pointer-events-none select-none"
                  sizes="80px"
                  quality={75}
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <div className="flex-grow space-y-1 text-start">
                <h4 className="font-bold text-on-surface text-base leading-snug">{product.name}</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                    {product.category || 'عام'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    product.stock === 0
                      ? 'bg-red-50 text-primary border border-red-100'
                      : product.stock <= 5
                      ? 'bg-yellow-50 text-secondary border border-yellow-100'
                      : 'bg-green-50 text-green-700 border border-green-100'
                  }`}>
                    {product.stock === 0 ? 'نفد من المخزون' : `${product.stock} وحدة`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low/40 p-2.5 rounded-lg">
              <div className="text-start">
                <span className="text-[10px] text-on-surface-variant block">السعر</span>
                <span className="font-bold text-primary text-base font-mono">
                  {formatCurrency(product.price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleActive(product)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                    product.is_active
                      ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                      : 'bg-white text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {product.is_active ? 'visibility' : 'visibility_off'}
                  </span>
                  {product.is_active ? 'نشط' : 'غير نشط'}
                </button>

                <button
                  onClick={() => onEdit(product)}
                  className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-secondary hover:border-secondary transition-all cursor-pointer bg-white"
                  title="تعديل المنتج"
                  aria-label="تعديل المنتج"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>

                <button
                  onClick={() => onDelete(product)}
                  className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer bg-white"
                  title="حذف المنتج"
                  aria-label="حذف المنتج"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center text-on-surface-variant font-medium text-sm">
          لم يتم العثور على أي منتجات مطابقة لخيارات التصفية.
        </div>
      )}
    </div>
  );
});
InventoryMobileList.displayName = 'InventoryMobileList';
