'use client';

import { memo, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
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
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 p-6 text-start font-poppins"
        style={{ animation: 'modalAppear 0.2s ease-out forwards' }}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-primary/5 text-primary border border-primary/10'
            }`}
          >
            <span className="material-symbols-outlined text-[26px] select-none">
              {isDestructive ? 'report' : 'help'}
            </span>
          </div>
          <div className="flex-grow space-y-2">
            <h3 className="text-body-lg font-bold text-on-surface leading-snug">
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
    </div>
  );
});
