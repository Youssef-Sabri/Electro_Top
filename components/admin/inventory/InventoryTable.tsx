'use client';

import { memo } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import type { Product } from '@/types';

interface InventoryTableProps {
  isLoaded: boolean;
  products: Product[];
  onToggleActive: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const InventoryTable = memo(function InventoryTable({
  isLoaded,
  products,
  onToggleActive,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="hidden lg:table w-full text-start border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold text-xs uppercase tracking-wider text-start">
            <th scope="col" className="py-4 px-6 text-start">الصورة</th>
            <th scope="col" className="py-4 px-6 text-start">تفاصيل المنتج</th>
            <th scope="col" className="py-4 px-6 text-start">الفئة</th>
            <th scope="col" className="py-4 px-6 text-end">السعر</th>
            <th scope="col" className="py-4 px-6 text-center">المخزون</th>
            <th scope="col" className="py-4 px-6 text-center">الظهور</th>
            <th scope="col" className="py-4 px-6 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10 text-sm">
          {!isLoaded ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-row-${idx}`} className="border-b border-outline-variant/10">
                <td className="px-6 py-4"><Skeleton className="h-16 w-16 rounded-lg" /></td>
                <td className="px-6 py-4"><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></td>
                <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                <td className="px-6 py-4"><div className="flex justify-center"><Skeleton className="h-6 w-20 rounded-full" /></div></td>
                <td className="px-6 py-4"><div className="flex justify-center"><Skeleton className="h-7 w-20 rounded-lg" /></div></td>
                <td className="px-6 py-4"><div className="flex justify-center gap-2"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /></div></td>
              </tr>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id} className="hover:bg-surface-container-low/30 transition-colors">
                <td className="py-4 px-6 text-start">
                  <div className="relative w-16 h-16 rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-low">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover pointer-events-none select-none"
                      sizes="64px"
                      quality={75}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                </td>

                <td className="py-4 px-6 max-w-xs md:max-w-md text-start">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="font-bold text-on-surface text-base">{product.name}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 truncate">
                    {product.description}
                  </p>
                </td>

                <td className="py-4 px-6 text-start">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                    {product.category}
                  </span>
                </td>

                <td className="py-4 px-6 text-end font-bold text-primary text-base font-mono tabular-nums">
                  {formatCurrency(product.price)}
                </td>

                <td className="py-4 px-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      product.stock === 0
                        ? 'bg-red-50 text-primary border border-red-100'
                        : product.stock <= 5
                        ? 'bg-yellow-50 text-secondary border border-yellow-100'
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {product.stock === 0 ? 'نفد من المخزون' : `${product.stock} وحدة`}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-6 text-center">
                  <button
                    onClick={() => onToggleActive(product)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                      product.is_active
                        ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {product.is_active ? 'visibility' : 'visibility_off'}
                    </span>
                    {product.is_active ? 'نشط' : 'غير نشط'}
                  </button>
                </td>

                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
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
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-12 px-6 text-center text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-4xl block mb-2 select-none">inventory</span>
                لم يتم العثور على منتجات مطابقة للتصفية.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
InventoryTable.displayName = 'InventoryTable';
