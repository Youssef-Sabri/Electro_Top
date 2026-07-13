'use client';

import { memo, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { usePagination } from '@/hooks/usePagination';
import { ProductCard } from '@/components/catalog/ProductCard';
import type { Product, CategoryGroup } from '@/types';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

const ProductDetailsModal = dynamic(
  () => import('@/components/catalog/ProductDetailsModal').then((mod) => mod.ProductDetailsModal),
  { ssr: false }
);

const ALL_CATEGORIES = 'All';
type SortByType = 'name-asc' | 'price-asc' | 'price-desc';

interface ShopPageContentProps {
  initialProducts: Product[];
  initialCategories: string[];
  initialHierarchy: CategoryGroup[];
}

export const ShopPageContent = memo(function ShopPageContent({ initialProducts, initialCategories, initialHierarchy }: ShopPageContentProps) {
  const { products: contextProducts, initializeData, isLoaded } = useProducts();
  const { hierarchy: categoryHierarchy } = useCategoryHierarchy(initialHierarchy);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialSync = useRef(false);

  useEffect(() => {
    if (!isLoaded && initialProducts && initialProducts.length > 0) {
      initializeData(initialProducts, initialCategories);
    }
  }, [isLoaded, initialProducts, initialCategories, initializeData]);

  const products = contextProducts.length > 0 ? contextProducts : initialProducts;

  const [category, setCategory] = useState(() => searchParams.get('category') || ALL_CATEGORIES);
  const [selectedMainCategory, setSelectedMainCategory] = useState(ALL_CATEGORIES);
  const [selectedSubCategory, setSelectedSubCategory] = useState(ALL_CATEGORIES);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [hideOutOfStock, setHideOutOfStock] = useState(() => searchParams.get('hideOut') === 'true');
  const [sortBy, setSortBy] = useState<SortByType>(() => (searchParams.get('sort') as SortByType) || 'name-asc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Sync selection states when main category category state changes
  useEffect(() => {
    if (category === ALL_CATEGORIES) {
      setSelectedMainCategory(ALL_CATEGORIES);
      setSelectedSubCategory(ALL_CATEGORIES);
    } else {
      const group = categoryHierarchy.find(g => g.name === category);
      if (group) {
        setSelectedMainCategory(category);
        setSelectedSubCategory(ALL_CATEGORIES);
      } else {
        const parent = categoryHierarchy.find(g => (g.subcategories || []).includes(category));
        if (parent) {
          setSelectedMainCategory(parent.name);
          setSelectedSubCategory(category);
        } else {
          setSelectedMainCategory(ALL_CATEGORIES);
          setSelectedSubCategory(ALL_CATEGORIES);
        }
      }
    }
  }, [category, categoryHierarchy]);

  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isInitialSync.current) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (category === ALL_CATEGORIES) params.delete('category');
    else params.set('category', category);

    if (debouncedSearch === '') params.delete('search');
    else params.set('search', debouncedSearch);

    if (!hideOutOfStock) params.delete('hideOut');
    else params.set('hideOut', 'true');

    if (sortBy === 'name-asc') params.delete('sort');
    else params.set('sort', sortBy);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    if (`?${params.toString()}` !== window.location.search) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [category, debouncedSearch, hideOutOfStock, sortBy, router]);

  useEffect(() => {
    const urlCategory = searchParams.get('category') || ALL_CATEGORIES;
    const urlSearch = searchParams.get('search') || '';
    const urlHideOut = searchParams.get('hideOut') === 'true';
    const urlSort = (searchParams.get('sort') as SortByType) || 'name-asc';

    if (urlCategory !== category) setCategory(urlCategory);
    if (urlSearch !== searchInput) setSearchInput(urlSearch);
    if (urlHideOut !== hideOutOfStock) setHideOutOfStock(urlHideOut);
    if (urlSort !== sortBy) setSortBy(urlSort);
    isInitialSync.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const normalizeArabic = (text: string) => {
      return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '') // remove diacritics
        .toLowerCase();
    };

    return products.filter((p) => {
      if (!p.is_active) return false;
      if (hideOutOfStock && p.stock === 0) return false;

      const query = debouncedSearch.trim().toLowerCase();
      const normQuery = normalizeArabic(query);
      const matchesSearch =
        !query ||
        normalizeArabic(p.name).includes(normQuery) ||
        normalizeArabic(p.description).includes(normQuery) ||
        p.id.toLowerCase().includes(query);

      let matchesCategory = true;
      if (category !== ALL_CATEGORIES) {
        const group = categoryHierarchy.find(g => g.name === category);
        if (group) {
          const allowed = [category, ...(group.subcategories || [])];
          matchesCategory = !!p.category && allowed.includes(p.category);
        } else {
          matchesCategory = p.category === category;
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, category, hideOutOfStock, categoryHierarchy]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [filteredProducts, sortBy]);

  const itemsPerPage = 12;
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedProducts,
    resetPage,
  } = usePagination(sortedProducts, itemsPerPage);

  useEffect(() => {
    resetPage();
  }, [category, debouncedSearch, hideOutOfStock, resetPage]);

  const handleClearFilters = useCallback(() => {
    setCategory(ALL_CATEGORIES);
    setSearchInput('');
    setHideOutOfStock(false);
    setSortBy('name-asc');
  }, []);

  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      <section className="bg-on-background py-16 text-start relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="text-secondary-fixed font-bold text-xs uppercase tracking-widest">
            اكتشف كتالوج منتجاتنا
          </span>
          <h1 className="font-headline-lg text-[32px] md:text-[40px] text-white font-extrabold mt-2">
            المتجر
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mt-4"></div>
        </div>
      </section>

      {/* Main Shop Container */}
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        
        {/* Sleek Filter Trigger Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 mb-8 premium-shadow premium-transition">
          {/* Active category trace path */}
          <div className="flex items-center gap-2 text-start">
            <span className="material-symbols-outlined text-primary text-[18px]">shopping_bag</span>
            <span className="font-bold text-xs text-on-surface">
              {category === ALL_CATEGORIES ? 'جميع المنتجات' : category}
            </span>
            <span className="text-[10px] bg-white border border-outline-variant/30 text-on-surface-variant px-2.5 py-0.5 rounded-full font-bold">
              {sortedProducts.length} منتج
            </span>
          </div>

          {/* Action trigger button */}
          <div className="flex items-center gap-3">
            {(category !== ALL_CATEGORIES || searchInput || hideOutOfStock || sortBy !== 'name-asc') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                إعادة تعيين
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="bg-primary hover:bg-primary/95 text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] premium-transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/15"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              تصفية وتصنيف
              {(category !== ALL_CATEGORIES || searchInput || hideOutOfStock || sortBy !== 'name-asc') && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {paginatedProducts.length > 0 ? (
          <div className="space-y-12">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant text-on-surface-variant text-xs font-bold px-3.5 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-primary">inventory_2</span>
                {sortedProducts.length} منتج
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={setSelectedProduct}
                  index={index}
                />
              ))}
            </div>

            <div className="flex justify-between items-center bg-surface-container-low border border-outline-variant/40 rounded-2xl px-6 py-4 select-none font-tajawal">
              <p className="text-xs text-on-surface-variant font-bold">
                الصفحة {currentPage} من {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 border border-outline-variant rounded-lg transition-all duration-200 flex items-center bg-white ${
                    currentPage === 1 
                      ? 'opacity-40 cursor-not-allowed text-on-surface-variant' 
                      : 'hover:border-primary hover:text-primary cursor-pointer text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 border border-outline-variant rounded-lg transition-all duration-200 flex items-center bg-white ${
                    currentPage === totalPages 
                      ? 'opacity-40 cursor-not-allowed text-on-surface-variant' 
                      : 'hover:border-primary hover:text-primary cursor-pointer text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-outline-variant/40 p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 select-none">
              search_off
            </span>
            <h3 className="font-bold text-[20px] text-on-surface mb-2">لم يتم العثور على أي منتجات</h3>
            <p className="text-on-surface-variant text-xs mb-6">
              لم نتمكن من العثور على أي مستلزمات كهربائية تطابق التصفية الحالية.
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:opacity-95 transition-opacity cursor-pointer text-xs"
            >
              إعادة تعيين التصفية
            </button>
          </div>
        )}
      </main>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Sliding Filter Drawer (Shared for Mobile and Desktop!) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" dir="rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative w-full max-w-[290px] sm:max-w-[360px] bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 animate-[slideInRight_0.25s_ease-out] border-s border-outline-variant/10 p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">filter_list</span>
                <h3 className="font-bold text-sm text-on-surface">تصفية وتصنيف المنتجات</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer border-0 bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Filters Stack */}
            <div className="flex-grow space-y-6 text-start">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant">البحث بالاسم أو الوصف</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pr-10 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right font-medium"
                    placeholder="ابحث عن منتجات..."
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base select-none">
                    search
                  </span>
                </div>
              </div>

              {/* Main Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant">القسم الرئيسي</label>
                <CustomDropdown
                  options={[
                    { value: ALL_CATEGORIES, label: 'جميع الأقسام' },
                    ...categoryHierarchy.map(g => ({ value: g.name, label: g.name }))
                  ]}
                  value={selectedMainCategory}
                  onChange={(val) => {
                    setSelectedMainCategory(val);
                    setSelectedSubCategory(ALL_CATEGORIES);
                    if (val === ALL_CATEGORIES) {
                      setCategory(ALL_CATEGORIES);
                    } else {
                      setCategory(val);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant">الفئة الفرعية</label>
                <CustomDropdown
                  options={[
                    { value: ALL_CATEGORIES, label: 'جميع الفئات الفرعية' },
                    ...(categoryHierarchy.find(g => g.name === selectedMainCategory)?.subcategories || []).map(sub => ({ value: sub, label: sub }))
                  ]}
                  value={selectedSubCategory}
                  onChange={(val) => {
                    setSelectedSubCategory(val);
                    if (val === ALL_CATEGORIES) {
                      setCategory(selectedMainCategory);
                    } else {
                      setCategory(val);
                    }
                  }}
                  disabled={selectedMainCategory === ALL_CATEGORIES}
                  className="w-full"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant">ترتيب المنتجات</label>
                <CustomDropdown
                  options={[
                    { value: 'name-asc', label: 'أبجدي (أ - ي)' },
                    { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
                    { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
                  ]}
                  value={sortBy}
                  onChange={(val: string) => setSortBy(val as SortByType)}
                  className="w-full"
                />
              </div>

              {/* Hide Out of Stock Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-on-surface select-none">
                  <input
                    type="checkbox"
                    checked={hideOutOfStock}
                    onChange={(e) => setHideOutOfStock(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant focus:ring-primary text-primary accent-primary cursor-pointer"
                  />
                  إخفاء غير المتوفر من المخزون
                </label>
              </div>
            </div>

            {/* Clear filters Button */}
            {(category !== ALL_CATEGORIES || searchInput || hideOutOfStock || sortBy !== 'name-asc') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant/30 py-3 rounded-xl font-bold text-xs active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                إعادة تعيين التصفية
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
