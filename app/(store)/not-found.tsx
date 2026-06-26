import Link from 'next/link';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-tajawal">
      <div className="text-center p-8 max-w-md">
        <span className="material-symbols-outlined text-[64px] text-brand-red-dark select-none mb-4">search_off</span>
        <h2 className="font-headline-md text-headline-md mb-2">الصفحة غير موجودة</h2>
        <p className="text-gray-500 text-sm mb-6">عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
        <Link
          href="/"
          className="inline-block bg-brand-red-dark text-white px-6 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity font-semibold uppercase tracking-wider"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
