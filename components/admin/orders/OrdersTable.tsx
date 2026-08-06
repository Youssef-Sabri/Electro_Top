'use client';

import { memo } from 'react';
import { formatCurrency, formatOrderDate, getInitials } from '@/lib/utils';
import { StatusBadge, PaymentMethodBadge, Skeleton } from '@/components/ui';
import type { Order } from '@/types';

interface OrdersTableProps {
  isLoading: boolean;
  orders: Order[];
  onRowClick: (id: string) => void;
  onDeleteOrder: (id: string) => void;
}

export const OrdersTable = memo(function OrdersTable({
  isLoading,
  orders,
  onRowClick,
  onDeleteOrder,
}: OrdersTableProps) {
  return (
    <div className="overflow-x-auto lg:overflow-x-hidden">
      <table className="hidden lg:table w-full text-start border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant/30 select-none text-start">
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
              رقم الطلب
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
              العميل
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
              رقم الهاتف
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
              الحالة
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
              التاريخ
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
              الدفع
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-end">
              الإجمالي
            </th>
            <th scope="col" className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-end">
              الإجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`sk-row-${idx}`} className="border-b border-outline-variant/10">
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                <td className="px-6 py-4 text-end"><Skeleton className="h-8 w-8 rounded inline-block" /></td>
              </tr>
            ))
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const dateStr = formatOrderDate(order.created_at);

              return (
                <tr
                  key={order.id_unique_tracking}
                  onClick={() => onRowClick(order.id_unique_tracking)}
                  className="hover:bg-surface-container-low/50 transition-all duration-200 cursor-pointer origin-center"
                >
                  <td className="px-6 py-4 font-headline-md text-label-md text-secondary-fixed-dim font-bold text-start">
                    #{order.id_unique_tracking}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-xs select-none">
                        {getInitials(order.customer_name)}
                      </div>
                      <span className="font-body-md text-body-md text-on-surface font-semibold">
                        {order.customer_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface font-mono text-start">
                    {order.phone_number}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>

                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant text-start">
                    {dateStr}
                  </td>

                  <td className="px-6 py-4 font-body-md text-body-md text-on-surface text-start">
                    <PaymentMethodBadge method={order.payment_method} />
                  </td>

                  <td className="px-6 py-4 font-headline-md text-label-md text-on-surface text-end font-bold">
                    {formatCurrency(order.total_amount)}
                  </td>

                  <td className="px-6 py-4 text-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOrder(order.id_unique_tracking);
                      }}
                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer select-none"
                      title="حذف هذا الطلب"
                      aria-label="حذف هذا الطلب"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-20 text-on-surface-variant italic">
                لا توجد أي طلبات تطابق معايير البحث بالتصفية.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
OrdersTable.displayName = 'OrdersTable';
