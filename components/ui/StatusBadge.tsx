import { memo } from 'react';
import type { OrderStatus } from '@/types';
import { translateStatus } from '@/lib/utils/status';

interface StatusBadgeProps {
  status: OrderStatus;
}

const STATUS_STYLE_MAP: Record<OrderStatus, { dot: string; container: string }> = {
  'Pending Review': {
    dot: 'bg-[var(--color-status-pending)]',
    container: 'bg-secondary-container/20 text-on-secondary-container border-secondary-container/30',
  },
  'Accepted': {
    dot: 'bg-[var(--color-status-accepted)]',
    container: 'bg-[var(--color-status-accepted)]/10 text-[var(--color-status-accepted)] border-[var(--color-status-accepted)]/30',
  },
  'Processing': {
    dot: 'bg-[var(--color-status-processing)]',
    container: 'bg-[var(--color-status-processing)]/10 text-[var(--color-status-processing)] border-[var(--color-status-processing)]/30',
  },
  'Delivered': {
    dot: 'bg-[var(--color-status-delivered)]',
    container: 'bg-[var(--color-status-delivered)]/10 text-[var(--color-status-delivered)] border-[var(--color-status-delivered)]/30',
  },
  'Declined': {
    dot: 'bg-[var(--color-status-declined)]',
    container: 'bg-[var(--color-status-declined)]/10 text-[var(--color-status-declined)] border-[var(--color-status-declined)]/30',
  },
  'Check Internal Note': {
    dot: 'bg-[var(--color-status-internal)]',
    container: 'bg-[var(--color-status-internal)]/10 text-[var(--color-status-internal)] border-[var(--color-status-internal)]/30',
  },
};

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLE_MAP[status] || {
    dot: 'bg-on-surface-variant',
    container: 'bg-surface-container-low text-on-surface border-outline-variant',
  };

  return (
    <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm inline-flex items-center gap-1 border select-none ${styles.container}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
      {translateStatus(status)}
    </span>
  );
});
