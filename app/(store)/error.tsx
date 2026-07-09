'use client';

export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-tajawal">
      <div className="text-center p-8 max-w-md">
        <span className="material-symbols-outlined text-[64px] text-brand-red-dark select-none mb-4">error_outline</span>
        <h2 className="font-headline-md text-headline-md mb-2">حدث خطأ غير متوقع</h2>
        <p className="text-on-surface-variant text-sm mb-6">يرجى المحاولة مرة أخرى.</p>
        <button
          onClick={reset}
          className="bg-brand-red-dark text-white px-6 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer font-semibold uppercase tracking-wider border-0"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
