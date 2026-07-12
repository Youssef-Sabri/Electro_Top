import { CategoriesClient } from '@/components/admin/CategoriesClient';

export const metadata = {
  title: 'إدارة الأقسام والكتالوج | لوحة التحكم',
  description: 'إدارة هيكل الأقسام الرئيسية والفرعية لمتجر إلكترو توب.',
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
