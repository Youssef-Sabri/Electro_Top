'use client';

import { memo, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import type { Order } from '@/types';

interface DashboardStats {
  totalRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  pendingCount: number;
  processingCount: number;
  deliveredCount: number;
  declinedCount: number;
  totalProductsCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  salesByCategory: Record<string, number>;
  unitsByCategory: Record<string, number>;
  recentOrders: Pick<Order, 'id_unique_tracking' | 'customer_name' | 'status' | 'total_amount' | 'created_at'>[];
}

export const DashboardClient = memo(function DashboardClient() {

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    pendingRevenue: 0,
    totalOrders: 0,
    pendingCount: 0,
    processingCount: 0,
    deliveredCount: 0,
    declinedCount: 0,
    totalProductsCount: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    salesByCategory: {},
    unitsByCategory: {},
    recentOrders: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchRef = useRef(0);
  const STALE_MS = 30_000;

  const fetchStats = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < STALE_MS) return;
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        lastFetchRef.current = now;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Tab focus refetch with staleness check
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal">
        <Spinner className="h-10 w-10 mb-4" />
        <p className="text-on-surface-variant text-sm">جاري تحميل إحصاءات لوحة التحكم...</p>
      </div>
    );
  }



  return (
    <div className="space-y-8 font-tajawal text-start">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
          إحصاءات لوحة التحكم
        </h1>
        <p className="text-on-surface-variant text-body-md mt-1">
          نظرة عامة على أداء المتجر، أرقام المبيعات، وملخصات الشحن والتوصيل.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="إجمالي الإيرادات" value={formatCurrency(stats.totalRevenue)} description="من الطلبات التي تم توصيلها" icon="payments" iconColor="text-green-600" />
        <StatCard title="قيد التنفيذ النشط" value={formatCurrency(stats.pendingRevenue)} description="من الطلبات المعلقة وقيد التحضير" icon="timeline" iconColor="text-primary" />
        <StatCard title="إجمالي الطلبات" value={stats.totalOrders} description="يشمل جميع الحالات والسجلات" icon="shopping_bag" iconColor="text-purple-600" />
        <StatCard title="المخزون بالكتالوج" value={stats.totalProductsCount} description={stats.outOfStockCount > 0 ? `⚠️ ${stats.outOfStockCount} نفد من المخزون` : 'جميع المنتجات النشطة'} icon="inventory_2" iconColor="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm xl:col-span-2 space-y-6">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">حالة شحن وتوصيل الطلبات</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-[var(--color-status-pending)]">{stats.pendingCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">قيد المراجعة</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-[var(--color-status-accepted)]">{stats.processingCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">قيد التحضير</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-[var(--color-status-delivered)]">{stats.deliveredCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">تم التوصيل</p>
            </div>
            <div className="bg-surface p-4 rounded-lg text-center border border-outline-variant/10">
              <p className="text-2xl font-black text-[var(--color-status-declined)]">{stats.declinedCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">مرفوض</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">مراقبة المخزون</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span className="text-body-md text-on-surface font-medium">نفد من المخزون</span>
              </div>
              <span className="bg-error/10 text-error px-2.5 py-1 rounded text-xs font-bold">{stats.outOfStockCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-pending)]"></span>
                <span className="text-body-md text-on-surface font-medium">مخزون منخفض (≤5)</span>
              </div>
              <span className="bg-[var(--color-status-pending)]/10 text-[var(--color-status-pending)] px-2.5 py-1 rounded text-xs font-bold">{stats.lowStockCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-delivered)]"></span>
                <span className="text-body-md text-on-surface font-medium">مخزون جيد (&gt;5)</span>
              </div>
              <span className="bg-[var(--color-status-delivered)]/10 text-[var(--color-status-delivered)] px-2.5 py-1 rounded text-xs font-bold">
                {Math.max(0, stats.totalProductsCount - stats.outOfStockCount - stats.lowStockCount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">حجم مبيعات الفئات</h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pe-2">
            {Object.keys(stats.salesByCategory).length > 0 ? (
              Object.entries(stats.salesByCategory).map(([cat, val]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-body-md text-sm font-medium">
                    <span className="text-on-surface">{cat}</span>
                    <span className="text-on-surface-variant">{formatCurrency(val as number)} ({stats.unitsByCategory[cat]} وحدة)</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full"
                      style={{ 
                        width: `${Math.max(5, Math.min(100, ((val as number) / (stats.totalRevenue + stats.pendingRevenue || 1)) * 100))}%` 
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

        <div className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm xl:col-span-2 space-y-6">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">الطلبات الواردة مؤخراً</h3>
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
                  stats.recentOrders.map((o) => (
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
