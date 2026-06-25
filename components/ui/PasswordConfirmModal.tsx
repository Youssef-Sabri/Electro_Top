'use client';

import { memo, useState, useEffect, useRef } from 'react';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (password: string) => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const PasswordConfirmModal = memo(function PasswordConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPassword('');
      setError('');
      setIsVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!password) {
      setError('الرجاء إدخال كلمة المرور.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('كلمة المرور غير صحيحة.');
      await onConfirm(password);
    } catch {
      setError('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 p-6 text-start font-poppins"
        style={{ animation: 'modalAppear 0.2s ease-out forwards' }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px] select-none">lock</span>
          </div>
          <div className="flex-grow space-y-2">
            <h3 className="text-body-lg font-bold text-on-surface leading-snug">{title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            dir="ltr"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            disabled={isVerifying}
            className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-on-background font-mono disabled:opacity-50"
          />
          {error && <p className="text-xs text-error font-semibold">{error}</p>}

          <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onCancel}
              disabled={isVerifying}
              className="px-4 py-2 bg-surface hover:bg-surface-container rounded-lg font-label-md text-label-md text-on-surface transition-colors cursor-pointer border border-outline-variant/40 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isVerifying}
              className="px-5 py-2 rounded-lg font-label-md text-label-md text-white transition-all cursor-pointer font-semibold bg-electro-red hover:bg-brand-red-dark disabled:opacity-50 flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px] select-none">sync</span>
                  جاري التحقق...
                </>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
