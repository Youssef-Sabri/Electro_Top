import type { Order } from '@/types';

export interface OrderMetrics {
  totalCount: number;
  pendingCount: number;
  activeFulfillmentCount: number;
  completedCount: number;
  declinedCount: number;
}

export function calculateOrderMetrics(orders: Order[]): OrderMetrics {
  return {
    totalCount: orders.length,
    pendingCount: orders.filter((o) => o.status === 'Pending Review').length,
    activeFulfillmentCount: orders.filter((o) => o.status === 'Processing' || o.status === 'Accepted').length,
    completedCount: orders.filter((o) => o.status === 'Delivered').length,
    declinedCount: orders.filter((o) => o.status === 'Declined').length,
  };
}
