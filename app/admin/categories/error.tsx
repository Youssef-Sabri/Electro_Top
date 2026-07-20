'use client';

export default function CategoriesError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-on-background font-tajawal text-white">
      <div className="text-center p-8 max-w-md">
        <span className="material-symbols-outlined text-[64px] text-primary select-none mb-4">error_outline</span>
        <h2 className="font-headline-md text-headline-md mb-2">حدث خطأ في إدارة الأقسام</h2>
        <p className="text-white/60 text-sm mb-6">يرجى المحاولة مرة أخرى.</p>
        <button
          onClick={reset}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer font-semibold uppercase tracking-wider border-0"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
