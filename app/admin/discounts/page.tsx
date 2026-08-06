import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { AdminTableSkeleton } from '@/components/admin/AdminSkeletons';

export const metadata: Metadata = {
  title: 'إدارة بنرات الخصومات والعروض | لوحة التحكم',
  description: 'إدارة بنرات الخصومات والعروض الترويجية للأقسام الفرعية لمتجر إلكترو توب.',
};

const DiscountsClient = dynamic(
  () => import('@/components/admin/DiscountsClient').then((mod) => mod.DiscountsClient),
  {
    loading: AdminTableSkeleton,
  }
);

export default function DiscountsPage() {
  return <DiscountsClient />;
}
