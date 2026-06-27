'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/format-currency';
import { formatOrderDate, todayStamp } from '@/lib/date-utils';
import { STATUS_OPTIONS } from '@/lib/status-utils';
import { getInitials } from '@/lib/string-utils';
import { exportToCSV } from '@/lib/csv-export';
import { calculateOrderMetrics } from '@/lib/order-utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PasswordConfirmModal } from '@/components/ui/PasswordConfirmModal';
import { Toast } from '@/components/ui/Toast';

export const OrdersLedger = memo(function OrdersLedger() {
  const { orders, getOrderItems, clearAllOrders, deleteOrder, page, totalPages, filters, setFilters, goToPage } = useOrders();
  const { getProductsMap } = useProducts();
  const router = useRouter();

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearPasswordOpen, setIsClearPasswordOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExportCSV = useCallback(() => {
    const headers = [
      'رقم التتبع',
      'اسم العميل',
      'رقم الهاتف',
      'المنتجات المشتراة',
      'الإجمالي المدفوع (جنيه)',
      'تاريخ الإنشاء',
      'الحالة',
      'طريقة الدفع'
    ];

    const productsById = getProductsMap();
    const rows = orders.map((order) => {
      const items = getOrderItems(order.id_unique_tracking);
      const itemsStr = items
        .map((item) => {
          const product = productsById.get(item.product_id);
          const name = product ? product.name : item.product_id;
          return `${name} (x${item.quantity})`;
        })
        .join('; ');

      const dateStr = formatOrderDate(order.created_at);

      return [
        order.id_unique_tracking,
        order.customer_name,
        order.phone_number,
        itemsStr,
        order.total_amount,
        dateStr,
        order.status,
        order.payment_method === 'cod' ? 'الدفع عند الاستلام' : order.payment_method === 'instapay' ? 'إنستاباي' : '-'
      ];
    });

    const dateStamp = todayStamp();
    exportToCSV({
      filename: `electro-top-orders-${dateStamp}.csv`,
      headers,
      rows,
    });
  }, [orders, getProductsMap, getOrderItems]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters({ searchQuery: value, status: filters.status });
  }, [filters.status, setFilters]);

  const handleStatusChange = useCallback((value: string) => {
    setFilters({ searchQuery: filters.searchQuery, status: value });
  }, [filters.searchQuery, setFilters]);

  const metrics = useMemo(() => calculateOrderMetrics(orders), [orders]);

  const handleRowClick = useCallback((trackingId: string) => {
    router.push(`/admin/orders/${trackingId}`);
  }, [router]);

  return (
    <section className="space-y-gutter font-tajawal">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-start">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">جميع الطلبات</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              إجمالي الطلبات في النظام: {orders.length} طلب.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit"
            title="تصدير كافة الطلبات إلى CSV"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            تصدير CSV
          </button>
          <button
            onClick={() => setIsClearConfirmOpen(true)}
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
            <input
              className="pr-10 pl-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary w-full sm:w-64 text-on-surface text-right"
              placeholder="البحث برقم الطلب، اسم العميل..."
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <CustomDropdown
            labelPrefix="الحالة:"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={handleStatusChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter text-start">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 electro-card">
          <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
            إجمالي الطلبات
          </p>
          <h3 className="text-secondary-fixed-dim font-headline-md text-headline-md font-bold">
            {metrics.totalCount}
          </h3>
          <div className="mt-2 text-green-600 font-label-sm text-label-sm flex items-center gap-1 select-none">
            <span className="material-symbols-outlined text-sm">inventory</span> سجلات نشطة في النظام
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 electro-card">
          <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
            قيد المراجعة
          </p>
          <h3 className="text-on-surface font-headline-md text-headline-md font-bold">
            {metrics.pendingCount}
          </h3>
          <div className="mt-2 text-primary font-label-sm text-label-sm flex items-center gap-1 select-none">
            <span className="material-symbols-outlined text-sm">notifications_active</span> بحاجة لاتخاذ إجراء
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 electro-card">
          <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
            قيد التحضير
          </p>
          <h3 className="text-on-surface font-headline-md text-headline-md font-bold">
            {metrics.activeFulfillmentCount}
          </h3>
          <div className="mt-2 text-secondary-fixed-dim font-label-sm text-label-sm flex items-center gap-1 select-none">
            <span className="material-symbols-outlined text-sm">bolt</span> في مسار التحضير حالياً
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 electro-card">
          <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider mb-1">
            الطلبات المكتملة
          </p>
          <h3 className="text-on-surface font-headline-md text-headline-md font-bold">
            {metrics.completedCount}
          </h3>
          <div className="mt-2 text-on-surface-variant font-label-sm text-label-sm">
            تم توصيلها بنجاح للعملاء
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden text-start">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 select-none text-start">
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
                  رقم الطلب
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
                  العميل
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
                  رقم الهاتف
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
                  الحالة
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-start">
                  التاريخ
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-end">
                  الدفع
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-end">
                  الإجمالي
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-end">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {orders.length > 0 ? (
                orders.map((order) => {
                  const dateStr = formatOrderDate(order.created_at);

                  const orderTotal = order.total_amount;

                  return (
                    <tr
                      key={order.id_unique_tracking}
                      onClick={() => handleRowClick(order.id_unique_tracking)}
                      className="hover:bg-surface-container-low/50 transition-all duration-200 cursor-pointer hover:scale-[1.002] origin-center"
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          order.payment_method === 'cod'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : order.payment_method === 'instapay'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          <span className="material-symbols-outlined text-[14px] select-none">
                            {order.payment_method === 'cod' ? 'payments' : order.payment_method === 'instapay' ? 'account_balance_wallet' : 'help'}
                          </span>
                          {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'instapay' ? 'InstaPay' : '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-headline-md text-label-md text-on-surface text-end font-bold">
                        {formatCurrency(orderTotal)}
                      </td>

                      <td className="px-6 py-4 text-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToDeleteId(order.id_unique_tracking);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer select-none"
                          title="حذف هذا الطلب"
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

        <PaginationControls
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={(n) => goToPage(n - 1)}
        />
      </div>

      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        title="مسح كافة الطلبات"
        message="هل أنت متأكد من رغبتك في حذف جميع الطلبات وسجل الطلبات نهائياً من النظام؟ هذا الإجراء لا يمكن التراجع عنه."
        onConfirm={() => {
          setIsClearConfirmOpen(false);
          setIsClearPasswordOpen(true);
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
        confirmLabel="نعم، احذف كافة البيانات"
      />

      <PasswordConfirmModal
        isOpen={isClearPasswordOpen}
        title="تأكيد كلمة المرور"
        message="يرجى إدخال كلمة مرور المسؤول لتأكيد حذف جميع الطلبات. هذا الإجراء لا يمكن التراجع عنه."
        confirmLabel="تأكيد وحذف الكل"
        onConfirm={async (password) => {
          setIsClearPasswordOpen(false);
          try {
            await clearAllOrders(password);
            setToast({ message: 'تم مسح جميع الطلبات بنجاح!', type: 'success' });
          } catch {
            setToast({ message: 'فشل حذف الطلبات. الرجاء المحاولة مرة أخرى.', type: 'error' });
          }
        }}
        onCancel={() => setIsClearPasswordOpen(false)}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="حذف الطلب"
        message={`هل أنت متأكد من رغبتك في حذف الطلب #${orderToDeleteId} نهائياً من النظام؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي لحذف تفاصيل الطلب وسجل حالته بالكامل.`}
        onConfirm={async () => {
          const idToDelete = orderToDeleteId;
          if (idToDelete) {
            setIsDeleteConfirmOpen(false);
            setOrderToDeleteId(null);
            try {
              await deleteOrder(idToDelete);
              setToast({ message: `تم حذف الطلب #${idToDelete} بنجاح!`, type: 'success' });
            } catch {
              setToast({ message: 'فشل حذف الطلب. الرجاء المحاولة مرة أخرى.', type: 'error' });
            }
          }
        }}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setOrderToDeleteId(null);
        }}
        confirmLabel="نعم، احذف الطلب"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </section>
  );
});
