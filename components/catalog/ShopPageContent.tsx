'use client';

import { memo, useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '../../hooks/useProducts';
import { usePagination } from '../../hooks/usePagination';
import { ProductCard } from './ProductCard';
import { Product } from '../../types';
import { CustomDropdown } from '../ui/CustomDropdown';

const ProductDetailsModal = dynamic(
  () => import('./ProductDetailsModal').then((mod) => mod.ProductDetailsModal),
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


  useEffect(() => {
    if (!isLoaded && initialProducts && initialProducts.length > 0) {
      initializeData(initialProducts, initialCategories);
    }
  }, [isLoaded, initialProducts, initialCategories, initializeData]);

  const products = contextProducts.length > 0 ? contextProducts : initialProducts;
  const categories = contextCategories.length > 0 ? contextCategories : initialCategories;

  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || ALL_CATEGORIES;
  const hideOutOfStock = searchParams.get('hideOut') === 'true';
  const sortBy = (searchParams.get('sort') as SortByType) || 'name-asc';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const deferredSearchQuery = useDeferredValue(searchInput);

  const updateFilter = useCallback((key: string, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === ALL_CATEGORIES) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (searchInput !== searchQuery) {
      updateFilter('search', searchInput);
    }
  }, [searchInput, searchQuery, updateFilter]);

  
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
      if (deferredSearchQuery) {
        const query = deferredSearchQuery.toLowerCase();
        matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);
      }

      return matchesCategory && matchesSearch;
    });
  }, [products, category, deferredSearchQuery, hideOutOfStock]);

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
  }, [searchQuery, category, hideOutOfStock, sortBy, resetPage]);

  const getCategoryLabel = (cat: string) => {
    if (cat === 'All') return 'جميع الأقسام';
    return CATEGORY_LABELS[cat] || cat;
  };

  const handleClearFilters = useCallback(() => {
    updateFilter('search', '');
    updateFilter('category', 'All');
    updateFilter('hideOut', false);
    updateFilter('sort', 'name-asc');
  }, [updateFilter]);

  return (
    <div className="min-h-screen bg-white font-poppins text-on-surface">
      {/* Page Title Header */}
      <section className="bg-on-background py-16 text-start relative overflow-hidden">
        <div className="absolute inset-0 diagonal-accents opacity-10"></div>
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <span className="text-electro-gold font-bold text-xs uppercase tracking-widest">
            اكتشف كتالوج منتجاتنا
          </span>
          <h1 className="font-headline-lg text-[32px] md:text-[40px] text-white font-extrabold mt-2">
            المتجر
          </h1>
          <div className="w-16 h-1 bg-electro-red rounded-full mt-4"></div>
        </div>
      </section>

      {/* Main Shop Container */}
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        
        {/* Filters and Search Bar Deck */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-xl text-start">
               <input
                 className="w-full bg-white border border-gray-300 rounded-lg pr-10 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
                 placeholder="البحث عن مستلزمات كهربائية..."
                 type="text"
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
               />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
                search
              </span>
            </div>

            {/* Sort & Availability Checkbox */}
            <div className="flex flex-wrap items-center gap-6 justify-start lg:justify-end">
              {/* Hide Out of stock checkbox */}
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-on-surface select-none">
               <input
                 type="checkbox"
                 checked={hideOutOfStock}
                 onChange={(e) => updateFilter('hideOut', e.target.checked)}
                 className="w-4.5 h-4.5 rounded border-gray-300 focus:ring-primary text-primary accent-primary cursor-pointer"
               />
                إخفاء المنتجات غير المتوفرة
              </label>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
               <CustomDropdown
                 labelPrefix="القسم:"
                 options={categoriesList.map(cat => ({ 
                   value: cat, 
                   label: getCategoryLabel(cat)
                 }))}
                 value={category}
                 onChange={(val) => updateFilter('category', val)}
                 className="min-w-[200px]"
               />
              </div>

              {/* Sort By Select */}
              <div className="flex items-center gap-2">
               <CustomDropdown
                 labelPrefix="ترتيب حسب:"
                 options={[
                   { value: 'name-asc', label: 'أبجدي (أ - ي)' },
                   { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
                   { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
                 ]}
                 value={sortBy}
                 onChange={(val) => updateFilter('sort', val)}
               />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {paginatedProducts.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
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
            <div className="flex justify-between items-center bg-surface-container-low border border-outline-variant/30 rounded-xl px-6 py-4 select-none font-poppins">
              <p className="font-label-md text-label-sm text-on-surface-variant font-medium">
                الصفحة {currentPage} من {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 border border-gray-300 rounded transition-all duration-200 flex items-center bg-white ${
                    currentPage === 1 
                      ? 'opacity-40 cursor-not-allowed text-on-surface-variant/40' 
                      : 'hover:border-primary hover:text-primary cursor-pointer text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 border border-gray-300 rounded transition-all duration-200 flex items-center bg-white ${
                    currentPage === totalPages 
                      ? 'opacity-40 cursor-not-allowed text-on-surface-variant/40' 
                      : 'hover:border-primary hover:text-primary cursor-pointer text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-outline-variant/35 p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 select-none">
              search_off
            </span>
            <h3 className="font-headline-md text-[20px] text-on-surface mb-2">لم يتم العثور على أي منتجات</h3>
            <p className="text-on-surface-variant text-label-sm mb-6">
              لم نتمكن من العثور على أي مستلزمات كهربائية تطابق التصفية الحالية.
            </p>
            <button
              onClick={handleClearFilters}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:opacity-90 transition-opacity cursor-pointer font-bold uppercase tracking-wider text-xs"
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
