'use client';

import { memo, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/format-currency';
import { calculateOrderMetrics } from '@/lib/order-utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const DashboardClient = memo(function DashboardClient() {
  const { orders, orderItems, refreshOrders } = useOrders();
  const { products, refreshProducts } = useProducts();

  // Refresh for new orders and product changes when dashboard becomes visible again
  // Realtime subscriptions handle live updates; tab focus refetch is a safety net.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshOrders();
        refreshProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshOrders, refreshProducts]);

  const stats = useMemo(() => {
    const orderMetrics = calculateOrderMetrics(orders);
    
    const completedOrders = orders.filter(o => o.status === 'Delivered');
    const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Declined');
    
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const pendingRevenue = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const totalProductsCount = products.length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;

    const ordersMap = new Map(orders.map(o => [o.id_unique_tracking, o]));
    const productsMap = new Map(products.map(p => [p.id, p]));

    const salesByCategory: Record<string, number> = {};
    const unitsByCategory: Record<string, number> = {};

    orderItems.forEach(item => {
      const parentOrder = ordersMap.get(item.order_id);
      if (parentOrder && parentOrder.status === 'Delivered') {
        const prod = productsMap.get(item.product_id);
        const cat = (prod && prod.category) ? prod.category : 'أخرى';
        const cost = item.unit_price * item.quantity;
        
        salesByCategory[cat] = (salesByCategory[cat] || 0) + cost;
        unitsByCategory[cat] = (unitsByCategory[cat] || 0) + item.quantity;
      }
    });

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      totalRevenue,
      pendingRevenue,
      totalOrders: orderMetrics.totalCount,
      pendingCount: orderMetrics.pendingCount,
      processingCount: orderMetrics.activeFulfillmentCount,
      deliveredCount: orderMetrics.completedCount,
      declinedCount: orderMetrics.declinedCount,
      totalProductsCount,
      outOfStockCount,
      lowStockCount,
      salesByCategory,
      unitsByCategory,
      recentOrders,
    };
  }, [orders, orderItems, products]);


  return (
    <div className="space-y-8 font-poppins text-start">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          إحصاءات لوحة التحكم
        </h1>
        <p className="text-on-surface-variant text-body-md mt-1">
          نظرة عامة على أداء المتجر، أرقام المبيعات، وملخصات الشحن والتوصيل.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">إجمالي الإيرادات</span>
            <span className="material-symbols-outlined text-green-600 bg-green-50 p-2 rounded-lg text-[20px]">payments</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight">
            {formatCurrency(stats.totalRevenue)}
          </h2>
          <p className="text-xs text-on-surface-variant">من الطلبات التي تم توصيلها</p>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">قيد التنفيذ النشط</span>
            <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg text-[20px]">timeline</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight">
            {formatCurrency(stats.pendingRevenue)}
          </h2>
          <p className="text-xs text-on-surface-variant">من الطلبات المعلقة وقيد التحضير</p>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">إجمالي الطلبات</span>
            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2 rounded-lg text-[20px]">shopping_bag</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight">
            {stats.totalOrders}
          </h2>
          <p className="text-xs text-on-surface-variant">يشمل جميع الحالات والسجلات</p>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">المخزون بالكتالوج</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2 rounded-lg text-[20px]">inventory_2</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight">
            {stats.totalProductsCount}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {stats.outOfStockCount > 0 ? (
              <span className="text-red-500 font-medium">⚠️ {stats.outOfStockCount} نفد من المخزون</span>
            ) : (
              <span>جميع المنتجات النشطة</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">حالة شحن وتوصيل الطلبات</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-amber-600">{stats.pendingCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">قيد المراجعة</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-blue-600">{stats.processingCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">قيد التحضير</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-green-600">{stats.deliveredCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">تم التوصيل</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-red-600">{stats.declinedCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">مرفوض</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">مراقبة المخزون</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-body-md text-on-surface font-medium">نفد من المخزون</span>
              </div>
              <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded text-xs font-bold">{stats.outOfStockCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-body-md text-on-surface font-medium">مخزون منخفض (≤5)</span>
              </div>
              <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded text-xs font-bold">{stats.lowStockCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-body-md text-on-surface font-medium">مخزون جيد (&gt;5)</span>
              </div>
              <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded text-xs font-bold">
                {Math.max(0, stats.totalProductsCount - stats.outOfStockCount - stats.lowStockCount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">حجم مبيعات الفئات</h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pe-2 scrollbar-thin scrollbar-thumb-outline-variant">
            {Object.keys(stats.salesByCategory).length > 0 ? (
              Object.entries(stats.salesByCategory).map(([cat, val]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-body-md text-sm font-medium">
                    <span className="text-on-surface">{cat}</span>
                    <span className="text-on-surface-variant">{formatCurrency(val)} ({stats.unitsByCategory[cat]} وحدة)</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full"
                      style={{ 
                        width: `${Math.max(5, Math.min(100, (val / (stats.totalRevenue + stats.pendingRevenue || 1)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant italic">لم يتم تسجيل أي معاملات بيع بعد.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="font-headline-md text-headline-sm font-bold text-on-surface">الطلبات الواردة مؤخراً</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-outline-variant/10 text-on-surface-variant select-none">
                  <th className="pb-3 text-xs uppercase tracking-wider font-bold">رقم التتبع</th>
                  <th className="pb-3 text-xs uppercase tracking-wider font-bold">العميل</th>
                  <th className="pb-3 text-xs uppercase tracking-wider font-bold">الإجمالي</th>
                  <th className="pb-3 text-xs uppercase tracking-wider font-bold text-end">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map(o => (
                    <tr key={o.id_unique_tracking} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3.5 font-mono text-sm font-semibold text-primary text-start">
                        <Link href={`/admin/orders/${o.id_unique_tracking}`} className="hover:underline">
                          {o.id_unique_tracking}
                        </Link>
                      </td>
                      <td className="py-3.5 text-sm font-medium text-on-surface text-start">{o.customer_name}</td>
                      <td className="py-3.5 text-sm font-bold text-on-surface text-start">{formatCurrency(o.total_amount)}</td>
<td className="py-3.5 text-sm text-end">
  <StatusBadge status={o.status} />
</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-sm text-on-surface-variant italic">
                      لم يتم تسجيل أي طلبات بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});
