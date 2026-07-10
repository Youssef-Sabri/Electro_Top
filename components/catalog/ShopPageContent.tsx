'use client';

import { memo, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { usePagination } from '@/hooks/usePagination';
import { ProductCard } from '@/components/catalog/ProductCard';
import type { Product } from '@/types';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

const ProductDetailsModal = dynamic(
  () => import('@/components/catalog/ProductDetailsModal').then((mod) => mod.ProductDetailsModal),
  { ssr: false }
);

const ALL_CATEGORIES = 'All';
type SortByType = 'name-asc' | 'price-asc' | 'price-desc';

const CATEGORY_LABELS: Record<string, string> = {
  'Circuit Protection': 'حماية الدوائر الكهربائية',
  'Distribution Boards': 'لوحات التوزيع',
  'Cables & Wires': 'كابلات وأسلاك',
  'Wiring Accessories': 'إكسسوارات التوصيل',
};

interface ShopPageContentProps {
  initialProducts: Product[];
  initialCategories: string[];
}

export const ShopPageContent = memo(function ShopPageContent({ initialProducts, initialCategories }: ShopPageContentProps) {
  const { products: contextProducts, categories: contextCategories, initializeData, isLoaded } = useProducts();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialSync = useRef(false);

  useEffect(() => {
    if (!isLoaded && initialProducts && initialProducts.length > 0) {
      initializeData(initialProducts, initialCategories);
    }
  }, [isLoaded, initialProducts, initialCategories, initializeData]);

  const products = contextProducts.length > 0 ? contextProducts : initialProducts;
  const categories = contextCategories.length > 0 ? contextCategories : initialCategories;

  const [category, setCategory] = useState(() => searchParams.get('category') || ALL_CATEGORIES);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [hideOutOfStock, setHideOutOfStock] = useState(() => searchParams.get('hideOut') === 'true');
  const [sortBy, setSortBy] = useState<SortByType>(() => (searchParams.get('sort') as SortByType) || 'name-asc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const categoriesList = useMemo(() => {
    const cleanCats = categories.filter(cat => {
      if (!cat) return false;
      const lower = cat.trim().toLowerCase();
      return lower !== 'all' && lower !== 'all categories';
    });
    return ['All', ...cleanCats];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product.is_active) return false;
      if (hideOutOfStock && product.stock <= 0) return false;

      let matchesCategory = true;
      if (category !== 'All') {
        matchesCategory = product.category === category;
      }

      let matchesSearch = true;
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);
      }

      return matchesCategory && matchesSearch;
    });
  }, [products, category, debouncedSearch, hideOutOfStock]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [filteredProducts, sortBy]);

  const itemsPerPage = 8;
  const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedProducts, resetPage } = usePagination(sortedProducts, itemsPerPage);

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, category, hideOutOfStock, sortBy, resetPage]);

  const getCategoryLabel = (cat: string) => {
    if (cat === 'All') return 'جميع الأقسام';
    return CATEGORY_LABELS[cat] || cat;
  };

  const handleClearFilters = useCallback(() => {
    setCategory(ALL_CATEGORIES);
    setSearchInput('');
    setHideOutOfStock(false);
    setSortBy('name-asc');
  }, []);

  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      {/* Sleek Dark Header Banner */}
      <section className="bg-on-background py-16 text-start relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#CA202B]/10 to-transparent pointer-events-none" />
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="text-secondary-fixed font-bold text-xs uppercase tracking-widest">
            اكتشف كتالوج منتجاتنا
          </span>
          <h1 className="font-headline-lg text-[32px] md:text-[40px] text-white font-extrabold mt-2">
            المتجر
          </h1>
          <div className="w-16 h-1 bg-[#CA202B] rounded-full mt-4"></div>
        </div>
      </section>

      {/* Main Shop Container */}
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        
        {/* Category chips list (Both mobile & desktop for clean inline visual filter tabs) */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
                category === cat
                  ? 'bg-primary text-on-primary border-transparent shadow-sm'
                  : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40 hover:text-primary'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Filters Toolbar */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-grow max-w-xl text-start">
               <input
                 className="w-full bg-white border border-outline-variant rounded-full pr-11 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
                 placeholder="البحث عن مستلزمات كهربائية..."
                 type="text"
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
               />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
                search
              </span>
            </div>

            {/* Other Controls */}
            <div className="flex flex-wrap items-center gap-6 justify-start lg:justify-end">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-on-surface select-none">
               <input
                 type="checkbox"
                 checked={hideOutOfStock}
                 onChange={(e) => setHideOutOfStock(e.target.checked)}
                 className="w-[18px] h-[18px] rounded border-outline-variant focus:ring-primary text-primary accent-primary cursor-pointer"
               />
                إخفاء غير المتوفر
              </label>

              <div className="flex items-center gap-2">
               <CustomDropdown
                 labelPrefix="ترتيب حسب:"
                 options={[
                   { value: 'name-asc', label: 'أبجدي (أ - ي)' },
                   { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
                   { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
                 ]}
                 value={sortBy}
                 onChange={(val) => setSortBy(val as SortByType)}
               />
              </div>
            </div>
          </div>
        </div>

        {paginatedProducts.length > 0 ? (
          <div className="space-y-12">
            {/* Product count badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant text-on-surface-variant text-xs font-bold px-3.5 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-primary">inventory_2</span>
                {sortedProducts.length} منتج
              </span>
            </div>

            {/* Grid */}
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

            {/* Pagination Controls */}
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
    </div>
  );
});
ShopPageContent.displayName = 'ShopPageContent';
