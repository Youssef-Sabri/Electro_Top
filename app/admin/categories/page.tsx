import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'إدارة الأقسام والكتالوج | لوحة التحكم',
  description: 'إدارة هيكل الأقسام الرئيسية والفرعية لمتجر إلكترو توب.',
};

const CategoriesClient = dynamic(
  () => import('@/components/admin/CategoriesClient').then((mod) => mod.CategoriesClient),
  {
    loading: () => (
      <div className="w-full py-20 text-center font-tajawal text-on-surface-variant">
        <p className="text-sm">جاري تحميل إدارة الأقسام...</p>
      </div>
    ),
  }
);

export default function CategoriesPage() {
  return <CategoriesClient />;
}
