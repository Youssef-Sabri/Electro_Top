'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { TABLES, ORDER_ITEM_SELECT_FIELDS } from '@/lib/constants';

import {
  useOrders,
  useProducts,
  useHydrated,
  useToast,
} from '@/hooks';

import {
  exportToCSV,
  formatOrderDate,
  todayStamp,
} from '@/lib/utils';

import type { OrderItem } from '@/types';

import {
  StatCard,
  PaginationControls,
  ConfirmationModal,
  PasswordConfirmModal,
  Toast,
} from '@/components/ui';

import { OrdersFilterBar } from '@/components/admin/orders/OrdersFilterBar';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrdersMobileList } from '@/components/admin/orders/OrdersMobileList';

import { AdminTableSkeleton } from '@/components/admin/AdminSkeletons';

export const OrdersLedger = memo(function OrdersLedger() {
  const { orders, isLoading, clearAllOrders, deleteOrder, page, totalPages, filters, setFilters, goToPage, globalCounts } = useOrders();
  const { getProductsMap } = useProducts();
  const router = useRouter();

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearPasswordOpen, setIsClearPasswordOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState(filters.searchQuery);
  const isMounted = useHydrated();
  const { toast, showSuccess, showError, dismissToast } = useToast();

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClearOrdersConfirm = useCallback(async (password: string) => {
    setIsClearPasswordOpen(false);
    try {
      await clearAllOrders(password);
      showSuccess('تم مسح جميع الطلبات بنجاح!');
    } catch {
      showError('فشل حذف الطلبات. الرجاء المحاولة مرة أخرى.');
    }
  }, [clearAllOrders, showSuccess, showError]);

  const handleClearOrdersCancel = useCallback(() => {
    setIsClearPasswordOpen(false);
  }, []);

  const handleDeleteOrderConfirm = useCallback(async () => {
    const idToDelete = orderToDeleteId;
    if (idToDelete) {
      setIsDeleteConfirmOpen(false);
      setOrderToDeleteId(null);
      try {
        await deleteOrder(idToDelete);
        showSuccess(`تم حذف الطلب #${idToDelete} بنجاح!`);
      } catch {
        showError('فشل حذف الطلب. الرجاء المحاولة مرة أخرى.');
      }
    }
  }, [orderToDeleteId, deleteOrder, showSuccess, showError]);

  const handleDeleteOrderCancel = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setOrderToDeleteId(null);
  }, []);

  const handleExportCSV = useCallback(async () => {
    const orderIds = orders.map(o => o.id_unique_tracking);
    const itemsMap = new Map<string, OrderItem[]>();
    if (orderIds.length > 0) {
      const { data, error } = await supabase
        .from(TABLES.orderItems)
        .select(ORDER_ITEM_SELECT_FIELDS)
        .in('order_id', orderIds);
      if (!error && data) {
        for (const item of data) {
          const existing = itemsMap.get(item.order_id) || [];
          itemsMap.set(item.order_id, [...existing, item]);
        }
      }
    }
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
      const items = itemsMap.get(order.id_unique_tracking) || [];
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
  }, [orders, getProductsMap]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters({ searchQuery: value, status: filters.status });
    }, 400);
  }, [filters.status, setFilters]);

  useEffect(() => {
    setSearchValue(filters.searchQuery);
  }, [filters.searchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setFilters({ searchQuery: filters.searchQuery, status: value });
  }, [filters.searchQuery, setFilters]);

  const metrics = globalCounts;

  const handleRowClick = useCallback((trackingId: string) => {
    router.push(`/admin/orders/${trackingId}`);
  }, [router]);

  const handlePageChange = useCallback((n: number) => goToPage(n - 1), [goToPage]);

  const handleClearConfirmSubmit = useCallback(() => {
    setIsClearConfirmOpen(false);
    setIsClearPasswordOpen(true);
  }, []);

  const handleClearConfirmCancel = useCallback(() => setIsClearConfirmOpen(false), []);

  const handleRequestDeleteOrder = useCallback((id: string) => {
    setOrderToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  if (!isMounted) {
    return <AdminTableSkeleton />;
  }

  return (
    <section className="space-y-gutter font-tajawal">
      <OrdersFilterBar
        totalCount={metrics.totalCount}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        statusFilter={filters.status}
        onStatusChange={handleStatusChange}
        onExportCSV={handleExportCSV}
        onClearAllOrders={() => setIsClearConfirmOpen(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter text-start">
        <StatCard title="إجمالي الطلبات" value={metrics.totalCount} description="سجلات نشطة في النظام" icon="shopping_bag" iconColor="text-purple-600" />
        <StatCard title="قيد المراجعة" value={metrics.pendingCount} description="⚠️ بحاجة لاتخاذ إجراء" icon="notifications_active" iconColor="text-amber-600" />
        <StatCard title="قيد التحضير" value={metrics.activeFulfillmentCount} description="في مسار التحضير حالياً" icon="bolt" iconColor="text-blue-600" />
        <StatCard title="الطلبات المكتملة" value={metrics.completedCount} description="تم توصيلها بنجاح للعملاء" icon="task_alt" iconColor="text-green-600" />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden text-start">
        <OrdersTable
          isLoading={isLoading}
          orders={orders}
          onRowClick={handleRowClick}
          onDeleteOrder={handleRequestDeleteOrder}
        />

        <OrdersMobileList
          isLoading={isLoading}
          orders={orders}
          onRowClick={handleRowClick}
          onDeleteOrder={handleRequestDeleteOrder}
        />

        <PaginationControls
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        title="مسح كافة الطلبات"
        message="هل أنت متأكد من رغبتك في حذف جميع الطلبات وسجل الطلبات نهائياً من النظام؟ هذا الإجراء لا يمكن التراجع عنه."
        onConfirm={handleClearConfirmSubmit}
        onCancel={handleClearConfirmCancel}
        confirmLabel="نعم، احذف كافة البيانات"
      />

      <PasswordConfirmModal
        isOpen={isClearPasswordOpen}
        title="تأكيد كلمة المرور"
        message="يرجى إدخال كلمة مرور المسؤول لتأكيد حذف جميع الطلبات. هذا الإجراء لا يمكن التراجع عنه."
        confirmLabel="تأكيد وحذف الكل"
        onConfirm={handleClearOrdersConfirm}
        onCancel={handleClearOrdersCancel}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="حذف الطلب"
        message={`هل أنت متأكد من رغبتك في حذف الطلب #${orderToDeleteId} نهائياً من النظام؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي لحذف تفاصيل الطلب وسجل حالته بالكامل.`}
        onConfirm={handleDeleteOrderConfirm}
        onCancel={handleDeleteOrderCancel}
        confirmLabel="نعم، احذف الطلب"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
          duration={3000}
        />
      )}
    </section>
  );
});
