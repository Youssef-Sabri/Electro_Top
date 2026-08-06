'use client';

import { memo } from 'react';
import { CustomDropdown } from '@/components/ui';
import { STATUS_OPTIONS } from '@/lib/utils';

interface OrdersFilterBarProps {
  totalCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onExportCSV: () => void;
  onClearAllOrders: () => void;
}

export const OrdersFilterBar = memo(function OrdersFilterBar({
  totalCount,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onExportCSV,
  onClearAllOrders,
}: OrdersFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-start">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">جميع الطلبات</h2>
          <p className="text-on-surface-variant font-body-md text-body-md">
            إجمالي الطلبات في النظام: {totalCount} طلب.
          </p>
        </div>
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit"
          title="تصدير كافة الطلبات إلى CSV"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          تصدير CSV
        </button>
        <button
          onClick={onClearAllOrders}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit"
          title="حذف جميع بيانات الطلبات"
        >
          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          مسح جميع الطلبات
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
            search
          </span>
          <label htmlFor="orders-search" className="sr-only">بحث في الطلبات</label>
          <input
            id="orders-search"
            className="pr-10 pl-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary w-full sm:w-64 text-on-surface text-start"
            placeholder="البحث برقم الطلب، اسم العميل..."
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <CustomDropdown
          labelPrefix="الحالة:"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusChange}
        />
      </div>
    </div>
  );
});
OrdersFilterBar.displayName = 'OrdersFilterBar';
