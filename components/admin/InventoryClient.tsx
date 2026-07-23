'use client';

import { memo, useState, useMemo, useEffect, useDeferredValue, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { usePagination } from '@/hooks/usePagination';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useHydrated } from '@/hooks/useHydrated';
import { useToast } from '@/hooks/useToast';
import { useProductForm } from '@/hooks/useProductForm';
import { formatCurrency } from '@/lib/utils/format';
import { todayStamp } from '@/lib/utils/date';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PasswordConfirmModal } from '@/components/ui/PasswordConfirmModal';
import { Toast } from '@/components/ui/Toast';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { exportToCSV } from '@/lib/utils/csv';
import { sortByRelevance } from '@/lib/utils/search';
import { defaultProductSort } from '@/lib/utils/sort';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { DeleteProductConfirmModal } from '@/components/admin/DeleteProductConfirmModal';

export const InventoryClient = memo(function InventoryClient() {

  const { products, addProduct, updateProduct, deleteProduct, clearAllProducts, isLoaded } = useProducts();
  const { hierarchy } = useCategoryHierarchy();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isInitialRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('search') || '');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(() => {
    const val = searchParams?.get('status');
    return (val === 'active' || val === 'inactive') ? val : 'all';
  });
  const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low' | 'instock'>(() => {
    const val = searchParams?.get('stock');
    return (val === 'out' || val === 'low' || val === 'instock') ? val : 'all';
  });
  const [selectedMainCategoryFilter, setSelectedMainCategoryFilter] = useState(() => searchParams?.get('mainCategory') || 'all');
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState(() => searchParams?.get('subCategory') || 'all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>(() => {
    const val = searchParams?.get('sort');
    if (val === 'price-asc' || val === 'price-desc') return val;
    return 'default';
  });

  const initialPage = useMemo(() => {
    const p = searchParams?.get('page');
    return p ? parseInt(p, 10) : 1;
  }, [searchParams]);

  const isMounted = useHydrated();

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const { toast, showSuccess, dismissToast } = useToast();

  const productForm = useProductForm({ hierarchy, addProduct, updateProduct, showSuccess, openConfirm, closeConfirm });
  const [isClearProductsPasswordOpen, setIsClearProductsPasswordOpen] = useState(false);

  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    return { total, active, outOfStock, totalStock };
  }, [products]);

  const activeFilterCategories = useMemo(() => {
    if (selectedMainCategoryFilter === 'all') return null;
    if (selectedSubCategoryFilter === 'all') {
      const group = hierarchy.find(h => h.name === selectedMainCategoryFilter);
      if (group) {
        return [selectedMainCategoryFilter, ...(group.subcategories || [])];
      }
      return [selectedMainCategoryFilter];
    }
    return [selectedSubCategoryFilter];
  }, [selectedMainCategoryFilter, selectedSubCategoryFilter, hierarchy]);

  const filteredProducts = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase();

    const filtered = products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'out' && p.stock === 0) ||
        (stockFilter === 'low' && p.stock > 0 && p.stock <= 5) ||
        (stockFilter === 'instock' && p.stock > 5);

      const matchesCategory =
        !activeFilterCategories ||
        (!!p.category && activeFilterCategories.includes(p.category));

      return matchesSearch && matchesStatus && matchesStock && matchesCategory;
    });

    if (q) {
      return sortByRelevance(filtered, deferredSearchQuery, (p) => p.name);
    }

    const list = [...filtered];
    if (sortBy === 'default') {
      list.sort(defaultProductSort);
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, deferredSearchQuery, statusFilter, stockFilter, activeFilterCategories, sortBy]);

  const itemsPerPage = 10;
  const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedProducts } = usePagination(filteredProducts, itemsPerPage, initialPage);

  const prevInventoryFiltersRef = useRef({
    searchQuery,
    statusFilter,
    stockFilter,
    selectedMainCategoryFilter,
    selectedSubCategoryFilter,
    sortBy,
  });

  // Synchronize state to URL & Hard Reset Page to 1 on Filter Change
  useEffect(() => {
    if (pathname !== '/admin/inventory') return;
    if (typeof window === 'undefined') return;

    const filtersChanged =
      prevInventoryFiltersRef.current.searchQuery !== searchQuery ||
      prevInventoryFiltersRef.current.statusFilter !== statusFilter ||
      prevInventoryFiltersRef.current.stockFilter !== stockFilter ||
      prevInventoryFiltersRef.current.selectedMainCategoryFilter !== selectedMainCategoryFilter ||
      prevInventoryFiltersRef.current.selectedSubCategoryFilter !== selectedSubCategoryFilter ||
      prevInventoryFiltersRef.current.sortBy !== sortBy;

    prevInventoryFiltersRef.current = {
      searchQuery,
      statusFilter,
      stockFilter,
      selectedMainCategoryFilter,
      selectedSubCategoryFilter,
      sortBy,
    };

    let effectivePage = currentPage;
    if (filtersChanged && !isInitialRef.current) {
      effectivePage = 1;
      setCurrentPage(1);
    }
    isInitialRef.current = false;

    const params = new URLSearchParams(window.location.search);

    if (searchQuery === '') params.delete('search');
    else params.set('search', searchQuery);

    if (statusFilter === 'all') params.delete('status');
    else params.set('status', statusFilter);

    if (stockFilter === 'all') params.delete('stock');
    else params.set('stock', stockFilter);

    if (selectedMainCategoryFilter === 'all') params.delete('mainCategory');
    else params.set('mainCategory', selectedMainCategoryFilter);

    if (selectedSubCategoryFilter === 'all') params.delete('subCategory');
    else params.set('subCategory', selectedSubCategoryFilter);

    if (sortBy === 'default') params.delete('sort');
    else params.set('sort', sortBy);

    if (effectivePage === 1) params.delete('page');
    else params.set('page', effectivePage.toString());

    const nextUrl = `${pathname}?${params.toString()}`;
    if (`?${params.toString()}` !== window.location.search) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [searchQuery, statusFilter, stockFilter, selectedMainCategoryFilter, selectedSubCategoryFilter, sortBy, currentPage, pathname, setCurrentPage]);

  // Sync URL query params back to state (for back/forward navigation and link resets)
  useEffect(() => {
    if (pathname !== '/admin/inventory') return;
    const urlSearch = searchParams?.get('search') || '';
    const urlStatus = (searchParams?.get('status') === 'active' || searchParams?.get('status') === 'inactive') ? searchParams.get('status') as 'all' | 'active' | 'inactive' : 'all';
    const urlStock = (searchParams?.get('stock') === 'out' || searchParams?.get('stock') === 'low' || searchParams?.get('stock') === 'instock') ? searchParams.get('stock') as 'all' | 'out' | 'low' | 'instock' : 'all';
    const urlMainCat = searchParams?.get('mainCategory') || 'all';
    const urlSubCat = searchParams?.get('subCategory') || 'all';
    const urlSort = (searchParams?.get('sort') === 'price-asc' || searchParams?.get('sort') === 'price-desc') ? searchParams.get('sort') as 'price-asc' | 'price-desc' : 'default';
    const urlPage = searchParams?.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

    const filtersChangedFromUrl =
      urlSearch !== searchQuery ||
      urlStatus !== statusFilter ||
      urlStock !== stockFilter ||
      urlMainCat !== selectedMainCategoryFilter ||
      urlSubCat !== selectedSubCategoryFilter ||
      urlSort !== sortBy;

    setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
    setStatusFilter((prev) => (prev === urlStatus ? prev : urlStatus));
    setStockFilter((prev) => (prev === urlStock ? prev : urlStock));
    setSelectedMainCategoryFilter((prev) => (prev === urlMainCat ? prev : urlMainCat));
    setSelectedSubCategoryFilter((prev) => (prev === urlSubCat ? prev : urlSubCat));
    setSortBy((prev) => (prev === urlSort ? prev : urlSort));

    if (filtersChangedFromUrl) {
      const explicitPage = searchParams?.has('page') ? urlPage : 1;
      setCurrentPage(explicitPage);
    } else if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
  }, [searchParams, pathname, setCurrentPage]);

  const handleExportCSV = useCallback(() => {
    const headers = [
      'معرف المنتج',
      'اسم المنتج',
      'الفئة',
      'السعر (ج.م)',
      'كمية المخزون',
      'الحالة',
      'الوصف'
    ];

    const rows = products.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.stock,
      product.is_active ? 'نشط' : 'غير نشط',
      product.description
    ]);

    const dateStamp = todayStamp();
    exportToCSV({
      filename: `electro-top-inventory-${dateStamp}.csv`,
      headers,
      rows,
    });
  }, [products]);

  const handleClearAllProducts = useCallback(() => {
    openConfirm({
      title: 'مسح المخزون بالكامل',
      message: 'هل أنت متأكد من رغبتك في حذف جميع المنتجات في المخزون نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.',
      confirmLabel: 'نعم، امسح كل المنتجات',
      cancelLabel: 'إلغاء',
      isDestructive: true,
      onConfirm: () => {
        closeConfirm();
        setIsClearProductsPasswordOpen(true);
      },
    });
  }, [openConfirm, closeConfirm]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingProduct) return;
    const productName = deletingProduct.name;
    const productId = deletingProduct.id;
    setDeletingProduct(null);
    try {
      await deleteProduct(productId);
      showSuccess(`تم حذف المنتج "${productName}" بنجاح!`);
    } catch {
      showSuccess('فشل حذف المنتج. الرجاء المحاولة مرة أخرى.');
    }
  }, [deletingProduct, deleteProduct, showSuccess]);

  const handleToggleActive = useCallback((product: Product) => {
    const actionName = product.is_active ? 'تعطيل' : 'تنشيط';
    openConfirm({
      title: `${product.is_active ? 'تعطيل' : 'تنشيط'} المنتج`,
      message: `هل أنت متأكد من رغبتك في ${actionName} المنتج "${product.name}"؟`,
      confirmLabel: product.is_active ? 'تعطيل' : 'تنشيط',
      cancelLabel: 'إلغاء',
      isDestructive: product.is_active,
      onConfirm: async () => {
        closeConfirm();
        try {
          await updateProduct({
            ...product,
            is_active: !product.is_active,
          });
          showSuccess(`المنتج "${product.name}" أصبح الآن ${!product.is_active ? 'نشطاً' : 'غير نشط'}!`);
        } catch {
          showSuccess(`فشل ${product.is_active ? 'تعطيل' : 'تنشيط'} المنتج. الرجاء المحاولة مرة أخرى.`);
        }
      },
    });
  }, [openConfirm, closeConfirm, updateProduct, showSuccess]);

  const handleClearProductsConfirm = useCallback(async (password: string) => {
    try {
      await clearAllProducts(password);
      showSuccess('تم حذف جميع عناصر المخزون.');
    } catch {
      showSuccess('فشل حذف جميع المنتجات. الرجاء المحاولة مرة أخرى.');
    }
    setIsClearProductsPasswordOpen(false);
  }, [clearAllProducts, showSuccess]);

  const handleClearProductsCancel = useCallback(() => {
    setIsClearProductsPasswordOpen(false);
  }, []);

  const handleMainCategoryFilterChange = useCallback((val: string) => {
    setSelectedMainCategoryFilter(val);
    setSelectedSubCategoryFilter('all');
  }, []);

  const handleDeleteProductCancel = useCallback(() => setDeletingProduct(null), []);

  const handleSubCategoryFilterChange = useCallback((val: string) => setSelectedSubCategoryFilter(val), []);
  const handleStatusFilterChange = useCallback((val: string) => setStatusFilter(val as 'all' | 'active' | 'inactive'), []);
  const handleStockFilterChange = useCallback((val: string) => setStockFilter(val as 'all' | 'out' | 'low' | 'instock'), []);
  const handleSortChange = useCallback((val: string) => setSortBy(val as 'default' | 'price-asc' | 'price-desc'), []);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل إدارة المخزون...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-tajawal text-on-surface" dir="rtl">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
          duration={3000}
        />
      )}

      <div className="flex flex-col lg:flex-row lg:flex-wrap justify-between items-start lg:items-center gap-4 w-full">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            إدارة المخزون
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 max-w-xl">
            قم بإنشاء وتعديل وتغيير ظهور وتحديث مخزون المنتجات في كتالوج المتجر الإلكتروني.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-5 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit uppercase tracking-wider font-bold"
            title="تصدير جميع عناصر المخزون إلى CSV"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            تصدير CSV
          </button>
          <button
            onClick={handleClearAllProducts}
            className="flex items-center gap-1.5 px-5 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit uppercase tracking-wider font-bold"
            title="حذف جميع المنتجات في الكتالوج"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            مسح المخزون
          </button>
          <button
            onClick={productForm.openAdd}
            className="bg-primary text-on-primary px-5 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            إضافة منتج جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="إجمالي المنتجات" value={metrics.total} description="جميع المنتجات بالكتالوج" icon="inventory_2" iconColor="text-on-surface-variant" />
        <StatCard title="الكتالوج النشط" value={metrics.active} description="المنتجات المعروضة للمشترين" icon="visibility" iconColor="text-green-600" />
        <StatCard title="نفد من المخزون" value={metrics.outOfStock} description="منتجات تحتاج لإعادة التعبئة" icon="warning" iconColor="text-primary" />
        <StatCard title="إجمالي وحدات المخزون" value={metrics.totalStock} description="عدد قطع المخزون المتاحة" icon="widgets" iconColor="text-secondary" />
      </div>

      <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-start space-y-5">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-3">
          <span className="material-symbols-outlined text-primary text-[24px]">search</span>
          <h4 className="font-bold text-sm text-on-surface">البحث والتصفية في الكتالوج</h4>
        </div>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full">
            <label htmlFor="inventory-search" className="sr-only">بحث في المنتجات</label>
            <input
              id="inventory-search"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pr-10 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start"
              placeholder="ابحث عن المنتجات بالاسم أو المعرف أو الوصف..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
              search
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CustomDropdown
              labelPrefix="القسم الرئيسي:"
              options={[
                { value: 'all', label: 'جميع الأقسام' },
                ...hierarchy.map(g => ({ value: g.name, label: g.name }))
              ]}
              value={selectedMainCategoryFilter}
              onChange={handleMainCategoryFilterChange}
            />

            <CustomDropdown
              labelPrefix="الفئة الفرعية:"
              options={[
                { value: 'all', label: 'جميع الفئات الفرعية' },
                ...(hierarchy.find(g => g.name === selectedMainCategoryFilter)?.subcategories || []).map(sub => ({ value: sub, label: sub }))
              ]}
              value={selectedSubCategoryFilter}
              onChange={handleSubCategoryFilterChange}
              disabled={selectedMainCategoryFilter === 'all'}
            />

            <CustomDropdown
              labelPrefix="الحالة:"
              options={[
                { value: 'all', label: 'الكل' },
                { value: 'active', label: 'نشط' },
                { value: 'inactive', label: 'غير نشط' }
              ]}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            />

            <CustomDropdown
              labelPrefix="المخزون:"
              options={[
                { value: 'all', label: 'جميع المستويات' },
                { value: 'instock', label: 'متوفر (> 5)' },
                { value: 'low', label: 'مخزون منخفض (1-5)' },
                { value: 'out', label: 'نفد من المخزون (0)' }
              ]}
              value={stockFilter}
              onChange={handleStockFilterChange}
            />

            <CustomDropdown
              labelPrefix="الترتيب:"
              options={[
                { value: 'default', label: 'الترتيب الافتراضي' },
                { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
                { value: 'price-desc', label: 'السعر: من الأعلى للأقل' }
              ]}
              value={sortBy}
              onChange={handleSortChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="hidden lg:table w-full text-start border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold text-xs uppercase tracking-wider text-start">
                <th scope="col" className="py-4 px-6 text-start">الصورة</th>
                <th scope="col" className="py-4 px-6 text-start">تفاصيل المنتج</th>
                <th scope="col" className="py-4 px-6 text-start">الفئة</th>
                <th scope="col" className="py-4 px-6 text-end">السعر</th>
                <th scope="col" className="py-4 px-6 text-center">المخزون</th>
                <th scope="col" className="py-4 px-6 text-center">الظهور</th>
                <th scope="col" className="py-4 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm">
              {!isLoaded ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`sk-row-${idx}`} className="border-b border-outline-variant/10">
                    <td className="px-6 py-4"><Skeleton className="h-16 w-16 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Skeleton className="h-6 w-20 rounded-full" /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Skeleton className="h-7 w-20 rounded-lg" /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center gap-2"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /></div></td>
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6 text-start">
                      <div className="relative w-16 h-16 rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-low">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover pointer-events-none select-none"
                          sizes="64px"
                          quality={75}
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-6 max-w-xs md:max-w-md text-start">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <p className="font-bold text-on-surface text-base">{product.name}</p>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 truncate">
                        {product.description}
                      </p>
                    </td>

                    <td className="py-4 px-6 text-start">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                        {product.category}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-end font-bold text-primary text-base font-mono tabular-nums">
                      {formatCurrency(product.price)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.stock === 0
                            ? 'bg-red-50 text-primary border border-red-100'
                            : product.stock <= 5
                            ? 'bg-yellow-50 text-secondary border border-yellow-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {product.stock === 0 ? 'نفد من المخزون' : `${product.stock} وحدة`}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                          product.is_active
                            ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {product.is_active ? 'visibility' : 'visibility_off'}
                        </span>
                        {product.is_active ? 'نشط' : 'غير نشط'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => productForm.openEdit(product)}
                          className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-secondary hover:border-secondary transition-all cursor-pointer bg-white"
                          title="تعديل المنتج"
                          aria-label="تعديل المنتج"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer bg-white"
                          title="حذف المنتج"
                          aria-label="حذف المنتج"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-4xl block mb-2 select-none">inventory</span>
                    لم يتم العثور على منتجات مطابقة للتصفية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (shown on mobile, hidden on desktop) */}
        <div className="block lg:hidden divide-y divide-outline-variant/10">
          {!isLoaded ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`sk-card-${idx}`} className="p-4 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-surface-container-low/40 p-2.5 rounded-lg">
                  <div className="space-y-1"><Skeleton className="h-3 w-8" /><Skeleton className="h-4 w-16" /></div>
                  <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /></div>
                </div>
              </div>
            ))
          ) : filteredProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <div key={product.id} className="p-4 space-y-4 hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-low shrink-0">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover pointer-events-none select-none"
                      sizes="80px"
                      quality={75}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-grow space-y-1 text-start">
                    <h4 className="font-bold text-on-surface text-base leading-snug">{product.name}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                        {product.category || 'عام'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        product.stock === 0
                          ? 'bg-red-50 text-primary border border-red-100'
                          : product.stock <= 5
                          ? 'bg-yellow-50 text-secondary border border-yellow-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {product.stock === 0 ? 'نفد من المخزون' : `${product.stock} وحدة`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-surface-container-low/40 p-2.5 rounded-lg">
                  {/* Price */}
                  <div className="text-start">
                    <span className="text-[10px] text-on-surface-variant block">السعر</span>
                    <span className="font-bold text-primary text-base font-mono">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                        product.is_active
                          ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                          : 'bg-white text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {product.is_active ? 'visibility' : 'visibility_off'}
                      </span>
                      {product.is_active ? 'نشط' : 'غير نشط'}
                    </button>

                    <button
                      onClick={() => productForm.openEdit(product)}
                      className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-secondary hover:border-secondary transition-all cursor-pointer bg-white"
                      title="تعديل المنتج"
                      aria-label="تعديل المنتج"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer bg-white"
                      title="حذف المنتج"
                      aria-label="حذف المنتج"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-on-surface-variant font-medium text-sm">
              لم يتم العثور على أي منتجات مطابقة لخيارات التصفية.
            </div>
          )}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={productForm.isAddModalOpen || !!productForm.editingProduct}
        editingProduct={productForm.editingProduct}
        isSaving={productForm.isSaving}
        formData={productForm.formData}
        formErrors={productForm.formErrors}
        formMainCategory={productForm.formMainCategory}
        hierarchy={hierarchy}
        isCompressing={productForm.isCompressing}
        isCompressing2={productForm.isCompressing2}
        isCompressing3={productForm.isCompressing3}
        compressionInfo={productForm.compressionInfo}
        compressionInfo2={productForm.compressionInfo2}
        compressionInfo3={productForm.compressionInfo3}
        onClose={productForm.closeModal}
        onSubmit={productForm.handleFormSubmit}
        onInputChange={productForm.handleInputChange}
        onCheckboxChange={productForm.handleCheckboxChange}
        onImageFileChange={productForm.handleImageFileChange}
        onSetAsMainImage={productForm.handleSetAsMainImage}
        onSetFormMainCategory={productForm.setFormMainCategory}
        onSetFormData={productForm.setFormData}
        onSetFormErrors={productForm.setFormErrors}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductConfirmModal
        product={deletingProduct}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteProductCancel}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel || 'إلغاء'}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      <PasswordConfirmModal
        isOpen={isClearProductsPasswordOpen}
        title="تأكيد كلمة المرور"
        message="يرجى إدخال كلمة مرور المسؤول لتأكيد حذف جميع المنتجات من المخزون. هذا الإجراء لا يمكن التراجع عنه."
        confirmLabel="تأكيد وحذف الكل"
        onConfirm={handleClearProductsConfirm}
        onCancel={handleClearProductsCancel}
      />
    </div>
  );
});
