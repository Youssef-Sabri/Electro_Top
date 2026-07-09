import { memo } from 'react';
import type { OrderStatus } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Pending Review':
      return (
        <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container font-label-sm text-label-sm inline-flex items-center gap-1 border border-secondary-container/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-pending)]"></span> قيد المراجعة
        </span>
      );
    case 'Accepted':
      return (
        <span className="px-3 py-1 rounded-full bg-[var(--color-status-accepted)]/10 text-[var(--color-status-accepted)] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[var(--color-status-accepted)]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-accepted)]"></span> مقبول
        </span>
      );
    case 'Processing':
      return (
        <span className="px-3 py-1 rounded-full bg-[var(--color-status-processing)]/10 text-[var(--color-status-processing)] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[var(--color-status-processing)]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-processing)]"></span> قيد التحضير
        </span>
      );
    case 'Delivered':
      return (
        <span className="px-3 py-1 rounded-full bg-[var(--color-status-delivered)]/10 text-[var(--color-status-delivered)] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[var(--color-status-delivered)]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-delivered)]"></span> تم التوصيل
        </span>
      );
    case 'Declined':
      return (
        <span className="px-3 py-1 rounded-full bg-[var(--color-status-declined)]/10 text-[var(--color-status-declined)] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[var(--color-status-declined)]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-declined)]"></span> مرفوض
        </span>
      );
    case 'Check Internal Note':
      return (
        <span className="px-3 py-1 rounded-full bg-[var(--color-status-internal)]/10 text-[var(--color-status-internal)] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[var(--color-status-internal)]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-internal)]"></span> قيد الفحص
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm inline-flex items-center gap-1 border border-outline-variant select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40"></span> {status}
        </span>
      );
  }
});
