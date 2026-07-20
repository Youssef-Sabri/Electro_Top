'use client';

import { memo } from 'react';
import type { Product } from '@/types';

interface DeleteProductConfirmModalProps {
  product: Product | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteProductConfirmModal = memo(function DeleteProductConfirmModal({ product, onConfirm, onCancel }: DeleteProductConfirmModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="تأكيد حذف المنتج">
      <div className="bg-white border border-outline-variant/20 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.2s_ease-out]">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-primary mx-auto">
            <span className="material-symbols-outlined text-3xl select-none">warning</span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">حذف المنتج؟</h3>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف **&quot;{product.name}&quot;**؟ سيؤدي هذا الإجراء إلى إزالة المنتج نهائياً من الكتالوج ولا يمكن التراجع عنه.
            </p>
          </div>
        </div>
        <div className="bg-surface-container-low p-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-white transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-bold uppercase tracking-wider"
          >
            تأكيد الحذف
          </button>
        </div>
      </div>
    </div>
  );
});
