'use client';

import { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency } from '@/lib/format-currency';
import { getInitials } from '@/lib/string-utils';
import { exportToCSV } from '@/lib/csv-export';
import { calculateOrderMetrics } from '@/lib/order-utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PasswordConfirmModal } from '@/components/ui/PasswordConfirmModal';

export const OrdersLedger = memo(function OrdersLedger() {
  const { orders, getOrderItems, clearAllOrders, deleteOrder } = useOrders();
  const { getProductsMap } = useProducts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearPasswordOpen, setIsClearPasswordOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const handleExportCSV = useCallback(() => {
    const headers = [
      'رقم التتبع',
      'اسم العميل',
      'رقم الهاتف',
      'المنتجات المشتراة',
      'الإجمالي المدفوع (جنيه)',
      'تاريخ الإنشاء',
      'الحالة'
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

      const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG');

      return [
        order.id_unique_tracking,
        order.customer_name,
        order.phone_number,
        itemsStr,
        order.total_amount,
        dateStr,
        order.status
      ];
    });

    const dateStamp = new Date().toISOString().split('T')[0];
    exportToCSV({
      filename: `electro-top-orders-${dateStamp}.csv`,
      headers,
      rows,
    });
  }, [orders, getProductsMap, getOrderItems]);

  // Filter orders based on ID/Name and status dropdown
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        order.id_unique_tracking.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.phone_number.toLowerCase().includes(query) ||
        (order.instapay_phone_number && order.instapay_phone_number.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'All' ||
        order.status === statusFilter ||
        (statusFilter === 'Pending' && order.status === 'Pending Review');

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Pagination
  const itemsPerPage = 10;
  const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedOrders, resetPage } = usePagination(filteredOrders, itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    resetPage();
  }, [searchQuery, statusFilter, resetPage]);

  // Metrics
  const metrics = useMemo(() => calculateOrderMetrics(orders), [orders]);


  const handleRowClick = useCallback((trackingId: string) => {
    router.push(`/admin/orders/${trackingId}`);
  }, [router]);

  return (
    <section className="space-y-gutter font-poppins">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-start">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">جميع الطلبات</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              إجمالي الطلبات في النظام: {filteredOrders.length} طلب.
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
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
              search
            </span>
            <input
              className="pr-10 pl-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary w-full sm:w-64 text-on-surface text-right"
              placeholder="البحث برقم الطلب، اسم العميل..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <CustomDropdown
            labelPrefix="الحالة:"
            options={[
              { value: 'All', label: 'الكل' },
              { value: 'Pending', label: 'قيد المراجعة' },
              { value: 'Accepted', label: 'مقبول' },
              { value: 'Processing', label: 'قيد التحضير' },
              { value: 'Delivered', label: 'تم التوصيل' },
              { value: 'Declined', label: 'مرفوض' },
              { value: 'Check Internal Note', label: 'قيد الفحص' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>
      </div>

      {/* Bento-style Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter text-start">
        {/* Total Orders */}
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

        {/* New Orders */}
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

        {/* Processing Orders */}
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

        {/* Completed Deliveries */}
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

      {/* Orders Table Container */}
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
                  الإجمالي
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-end">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

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
                  <td colSpan={7} className="text-center py-20 text-on-surface-variant italic">
                    لا توجد أي طلبات تطابق معايير البحث بالتصفية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center border-t border-outline-variant/30 select-none">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            الصفحة {currentPage} من {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 border border-outline-variant rounded transition-all duration-200 flex items-center bg-white ${
                currentPage === 1 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'hover:bg-white hover:text-primary cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 border border-outline-variant rounded transition-all duration-200 flex items-center bg-white ${
                currentPage === totalPages 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'hover:bg-white hover:text-primary cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
          </div>
        </div>
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
        onConfirm={async () => {
          clearAllOrders();
          setIsClearPasswordOpen(false);
        }}
        onCancel={() => setIsClearPasswordOpen(false)}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="حذف الطلب"
        message={`هل أنت متأكد من رغبتك في حذف الطلب #${orderToDeleteId} نهائياً من النظام؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي لحذف تفاصيل الطلب وسجل حالته بالكامل.`}
        onConfirm={() => {
          if (orderToDeleteId) {
            deleteOrder(orderToDeleteId);
          }
          setIsDeleteConfirmOpen(false);
          setOrderToDeleteId(null);
        }}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setOrderToDeleteId(null);
        }}
        confirmLabel="نعم، احذف الطلب"
      />
    </section>
  );
});
