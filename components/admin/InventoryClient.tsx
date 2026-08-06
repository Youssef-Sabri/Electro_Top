'use client';

import { memo, useState, useMemo, useEffect, useDeferredValue, useRef, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

import {
  useProducts,
  useCategoryHierarchy,
  usePagination,
  useConfirmModal,
  useHydrated,
  useToast,
  useProductForm,
} from '@/hooks';

import {
  exportToCSV,
  todayStamp,
  sortByRelevance,
  defaultProductSort,
} from '@/lib/utils';

import type { Product } from '@/types';

import {
  Skeleton,
  StatCard,
  ConfirmationModal,
  PasswordConfirmModal,
  Toast,
  PaginationControls,
} from '@/components/ui';

import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { DeleteProductConfirmModal } from '@/components/admin/DeleteProductConfirmModal';
import { InventoryFilterBar } from '@/components/admin/inventory/InventoryFilterBar';
import { InventoryTable } from '@/components/admin/inventory/InventoryTable';
import { InventoryMobileList } from '@/components/admin/inventory/InventoryMobileList';

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

  const latestInventoryFiltersRef = useRef({
    searchQuery,
    statusFilter,
    stockFilter,
    selectedMainCategoryFilter,
    selectedSubCategoryFilter,
    sortBy,
    currentPage,
  });

  useEffect(() => {
    latestInventoryFiltersRef.current = {
      searchQuery,
      statusFilter,
      stockFilter,
      selectedMainCategoryFilter,
      selectedSubCategoryFilter,
      sortBy,
      currentPage,
    };
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

  // Sync URL query params back to state
  useEffect(() => {
    if (pathname !== '/admin/inventory') return;
    const latest = latestInventoryFiltersRef.current;
    const urlSearch = searchParams?.get('search') || '';
    const urlStatus = (searchParams?.get('status') === 'active' || searchParams?.get('status') === 'inactive') ? searchParams.get('status') as 'all' | 'active' | 'inactive' : 'all';
    const urlStock = (searchParams?.get('stock') === 'out' || searchParams?.get('stock') === 'low' || searchParams?.get('stock') === 'instock') ? searchParams.get('stock') as 'all' | 'out' | 'low' | 'instock' : 'all';
    const urlMainCat = searchParams?.get('mainCategory') || 'all';
    const urlSubCat = searchParams?.get('subCategory') || 'all';
    const urlSort = (searchParams?.get('sort') === 'price-asc' || searchParams?.get('sort') === 'price-desc') ? searchParams.get('sort') as 'price-asc' | 'price-desc' : 'default';
    const urlPage = searchParams?.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

    const filtersChangedFromUrl =
      urlSearch !== latest.searchQuery ||
      urlStatus !== latest.statusFilter ||
      urlStock !== latest.stockFilter ||
      urlMainCat !== latest.selectedMainCategoryFilter ||
      urlSubCat !== latest.selectedSubCategoryFilter ||
      urlSort !== latest.sortBy;

    setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
    setStatusFilter((prev) => (prev === urlStatus ? prev : urlStatus));
    setStockFilter((prev) => (prev === urlStock ? prev : urlStock));
    setSelectedMainCategoryFilter((prev) => (prev === urlMainCat ? prev : urlMainCat));
    setSelectedSubCategoryFilter((prev) => (prev === urlSubCat ? prev : urlSubCat));
    setSortBy((prev) => (prev === urlSort ? prev : urlSort));

    if (filtersChangedFromUrl) {
      const explicitPage = searchParams?.has('page') ? urlPage : 1;
      setCurrentPage(explicitPage);
    } else if (urlPage !== latest.currentPage) {
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
      <div className="space-y-8 font-tajawal text-on-surface animate-pulse" dir="rtl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`sk-inv-stat-${i}`} className="bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
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

      <InventoryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hierarchy={hierarchy}
        selectedMainCategoryFilter={selectedMainCategoryFilter}
        onMainCategoryFilterChange={handleMainCategoryFilterChange}
        selectedSubCategoryFilter={selectedSubCategoryFilter}
        onSubCategoryFilterChange={handleSubCategoryFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        stockFilter={stockFilter}
        onStockFilterChange={handleStockFilterChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <InventoryTable
          isLoaded={isLoaded}
          products={paginatedProducts}
          onToggleActive={handleToggleActive}
          onEdit={productForm.openEdit}
          onDelete={setDeletingProduct}
        />

        <InventoryMobileList
          isLoaded={isLoaded}
          products={paginatedProducts}
          onToggleActive={handleToggleActive}
          onEdit={productForm.openEdit}
          onDelete={setDeletingProduct}
        />

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

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

      <DeleteProductConfirmModal
        product={deletingProduct}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteProductCancel}
      />

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
