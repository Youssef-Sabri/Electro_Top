'use client';

import { useEffect, useRef, memo } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

function ToastComponent({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  const onCloseRef = useRef(onClose);

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
    success: 'bg-green-600 text-white shadow-green-600/20',
    error: 'bg-electro-red text-white shadow-electro-red/20',
  };

  const icon = type === 'success' ? 'check_circle' : 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 toast-animate font-poppins" role="alert" aria-live="polite">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-white/10 ${bgColors[type]}`}
      >
        <span className="material-symbols-outlined text-[20px] shrink-0 select-none">{icon}</span>
        <p className="text-sm font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors duration-150 ml-auto shrink-0 cursor-pointer"
          aria-label="Close notification"
        >
          <span className="material-symbols-outlined text-[16px] select-none">close</span>
        </button>
      </div>
    </div>
  );
}

export const Toast = memo(ToastComponent);
