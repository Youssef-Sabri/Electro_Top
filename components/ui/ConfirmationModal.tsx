'use client';

import { memo } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  isDestructive = false,
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 p-6 text-start font-tajawal"
        style={{ animation: 'modalAppear 0.2s ease-out forwards' }}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-error/10 text-error border border-error/20'
                : 'bg-primary/5 text-primary border border-primary/10'
            }`}
          >
            <span className="material-symbols-outlined text-[26px] select-none">
              {isDestructive ? 'report' : 'help'}
            </span>
          </div>
          <div className="flex-grow space-y-2">
            <h3 className="text-body-md font-bold text-on-surface leading-snug">
              {title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant/10 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-surface hover:bg-surface-container rounded-lg font-label-md text-label-md text-on-surface transition-colors cursor-pointer border border-outline-variant/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg font-label-md text-label-md text-white transition-all cursor-pointer font-semibold ${
              isDestructive
                ? 'bg-electro-red hover:bg-brand-red-dark'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
});
