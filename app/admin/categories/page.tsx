import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AdminCategoriesSkeleton } from '@/components/admin/AdminSkeletons';

export const metadata: Metadata = {
  title: 'إدارة الأقسام والكتالوج | لوحة التحكم',
  description: 'إدارة هيكل الأقسام الرئيسية والفرعية لمتجر إلكترو توب.',
};

const CategoriesClient = dynamic(
  () => import('@/components/admin/CategoriesClient').then((mod) => mod.CategoriesClient),
  {
    loading: AdminCategoriesSkeleton,
  }
);

export default function CategoriesPage() {
  return <CategoriesClient />;
}
