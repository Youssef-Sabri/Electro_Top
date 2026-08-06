'use client';

import { memo } from 'react';
import { formatCurrency, formatOrderDate, getInitials } from '@/lib/utils';
import { StatusBadge, PaymentMethodBadge, Skeleton } from '@/components/ui';
import type { Order } from '@/types';

interface OrdersMobileListProps {
  isLoading: boolean;
  orders: Order[];
  onRowClick: (id: string) => void;
  onDeleteOrder: (id: string) => void;
}

export const OrdersMobileList = memo(function OrdersMobileList({
  isLoading,
  orders,
  onRowClick,
  onDeleteOrder,
}: OrdersMobileListProps) {
  return (
    <div className="block lg:hidden divide-y divide-outline-variant/10">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <div key={`sk-card-${idx}`} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ))
      ) : orders.length > 0 ? (
        orders.map((order) => {
          const dateStr = formatOrderDate(order.created_at);

          return (
            <div
              key={order.id_unique_tracking}
              onClick={() => onRowClick(order.id_unique_tracking)}
              className="p-4 space-y-4 hover:bg-surface-container-low/50 transition-all duration-200 cursor-pointer text-start"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm select-none">
                    {getInitials(order.customer_name)}
                  </div>
                  <div className="text-start">
                    <h4 className="font-bold text-on-surface text-base leading-snug">{order.customer_name}</h4>
                    <span className="text-xs text-on-surface-variant block mt-0.5">{order.phone_number}</span>
                  </div>
                </div>
                <span className="font-bold text-secondary-fixed-dim text-sm font-mono">
                  #{order.id_unique_tracking}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <StatusBadge status={order.status} />
                  <PaymentMethodBadge method={order.payment_method} />
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {dateStr}
                </span>
              </div>

              <div className="flex items-center justify-between bg-surface-container-low/40 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">الإجمالي</span>
                  <span className="font-bold text-on-surface text-base font-mono">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOrder(order.id_unique_tracking);
                  }}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer select-none flex items-center justify-center"
                  title="حذف هذا الطلب"
                  aria-label="حذف هذا الطلب"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-12 text-center text-on-surface-variant font-medium text-sm font-tajawal">
          لا توجد أي طلبات تطابق معايير البحث بالتصفية.
        </div>
      )}
    </div>
  );
});
OrdersMobileList.displayName = 'OrdersMobileList';
