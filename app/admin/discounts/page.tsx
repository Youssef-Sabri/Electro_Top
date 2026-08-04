import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const metadata: Metadata = {
  title: 'إدارة بنرات الخصومات والعروض | لوحة التحكم',
  description: 'إدارة بنرات الخصومات والعروض الترويجية للأقسام الفرعية لمتجر إلكترو توب.',
};

const DiscountsClient = dynamic(
  () => import('@/components/admin/DiscountsClient').then((mod) => mod.DiscountsClient),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل إدارة بنرات الخصومات...</p>
      </div>
    ),
  }
);

export default function DiscountsPage() {
  return <DiscountsClient />;
}
