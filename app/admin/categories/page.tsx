import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'إدارة الأقسام والكتالوج | لوحة التحكم',
  description: 'إدارة هيكل الأقسام الرئيسية والفرعية لمتجر إلكترو توب.',
};

const CategoriesClient = dynamic(
  () => import('@/components/admin/CategoriesClient').then((mod) => mod.CategoriesClient),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل إدارة الأقسام...</p>
      </div>
    ),
  }
);

export default function CategoriesPage() {
  return <CategoriesClient />;
}
