'use client';

import { useEffect, useRef, useMemo, memo } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

let toastCounter = 0;

function ToastComponent({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  const onCloseRef = useRef(onClose);
  const id = useMemo(() => ++toastCounter, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const bgColors = {
    success: 'bg-[var(--color-status-delivered)] text-white shadow-[var(--color-status-delivered)]/20',
    error: 'bg-electro-red text-white shadow-electro-red/20',
  };

  const icon = type === 'success' ? 'check_circle' : 'error';
  const bottomOffset = 24 + (id % 5) * 56;

  return (
    <div
      className="fixed z-50 font-tajawal pointer-events-none"
      style={{ bottom: `${bottomOffset}px`, right: '24px' }}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-white/10 toast-animate pointer-events-auto ${bgColors[type]}`}
        style={{ animationDuration: `${Math.max(duration, 3000)}ms` }}
      >
        <span className="material-symbols-outlined text-[20px] shrink-0 select-none">{icon}</span>
        <p className="text-sm font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors duration-150 ml-auto shrink-0 cursor-pointer"
          aria-label="إغلاق الإشعار"
        >
          <span className="material-symbols-outlined text-[16px] select-none">close</span>
        </button>
      </div>
    </div>
  );
}

export const Toast = memo(ToastComponent);
