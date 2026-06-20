import { memo } from 'react';

interface SpinnerProps {
  className?: string;
}

export const Spinner = memo(function Spinner({ className = 'h-6 w-6' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-brand-red-dark ${className}`}
      role="status"
      aria-label="جاري التحميل"
    >
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
});