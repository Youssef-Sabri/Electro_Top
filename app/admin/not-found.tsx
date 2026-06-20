import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-on-background font-poppins text-white">
      <div className="text-center p-8 max-w-md">
        <span className="material-symbols-outlined text-[64px] text-primary select-none mb-4">search_off</span>
        <h2 className="font-headline-md text-headline-md mb-2">الصفحة غير موجودة</h2>
        <p className="text-surface-variant text-sm mb-6">عذراً، لم نتمكن من العثور على الصفحة المطلوبة.</p>
        <Link
          href="/admin"
          className="inline-block bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity font-semibold uppercase tracking-wider border-0"
        >
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
