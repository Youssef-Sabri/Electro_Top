'use client';

import { memo } from 'react';
import { CustomDropdown } from '@/components/ui';
import type { CategoryGroup } from '@/types';

interface InventoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  hierarchy: CategoryGroup[];
  selectedMainCategoryFilter: string;
  onMainCategoryFilterChange: (val: string) => void;
  selectedSubCategoryFilter: string;
  onSubCategoryFilterChange: (val: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (val: string) => void;
  stockFilter: 'all' | 'out' | 'low' | 'instock';
  onStockFilterChange: (val: string) => void;
  sortBy: 'default' | 'price-asc' | 'price-desc';
  onSortChange: (val: string) => void;
}

export const InventoryFilterBar = memo(function InventoryFilterBar({
  searchQuery,
  onSearchChange,
  hierarchy,
  selectedMainCategoryFilter,
  onMainCategoryFilterChange,
  selectedSubCategoryFilter,
  onSubCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  stockFilter,
  onStockFilterChange,
  sortBy,
  onSortChange,
}: InventoryFilterBarProps) {
  const currentMainGroup = hierarchy.find(g => g.name === selectedMainCategoryFilter);
  const subcategoryOptions = currentMainGroup
    ? (currentMainGroup.subcategories || []).map(sub => ({ value: sub, label: sub }))
    : [];

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-start space-y-5">
      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-3">
        <span className="material-symbols-outlined text-primary text-[24px]">search</span>
        <h4 className="font-bold text-sm text-on-surface">البحث والتصفية في الكتالوج</h4>
      </div>

      <div className="space-y-4">
        <div className="relative w-full">
          <label htmlFor="inventory-search" className="sr-only">بحث في المنتجات</label>
          <input
            id="inventory-search"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pr-10 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start"
            placeholder="ابحث عن المنتجات بالاسم أو المعرف أو الوصف..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
            onChange={onMainCategoryFilterChange}
          />

          <CustomDropdown
            labelPrefix="الفئة الفرعية:"
            options={[
              { value: 'all', label: 'جميع الفئات الفرعية' },
              ...subcategoryOptions
            ]}
            value={selectedSubCategoryFilter}
            onChange={onSubCategoryFilterChange}
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
            onChange={onStatusFilterChange}
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
            onChange={onStockFilterChange}
          />

          <CustomDropdown
            labelPrefix="الترتيب:"
            options={[
              { value: 'default', label: 'الترتيب الافتراضي' },
              { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
              { value: 'price-desc', label: 'السعر: من الأعلى للأقل' }
            ]}
            value={sortBy}
            onChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
});
InventoryFilterBar.displayName = 'InventoryFilterBar';
