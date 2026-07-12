'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PaginationControls } from '@/components/ui/PaginationControls';

interface CategoryHierarchyItem {
  name: string;
  icon?: string;
  subcategories: string[];
}

export function CategoriesClient() {
  const [hierarchy, setHierarchy] = useState<CategoryHierarchyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMainCatName, setNewMainCatName] = useState('');
  const [newSubCatNames, setNewSubCatNames] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/category-hierarchy');
        if (res.ok) {
          const data = await res.json();
          if (active) setHierarchy(data);
        }
      } catch (e) {
        console.error('Failed to load category hierarchy:', e);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);



  const saveHierarchy = async (updated: CategoryHierarchyItem[], successMsg: string) => {
    try {
      const res = await fetch('/api/category-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Save failed');
      setHierarchy(updated);
      showToast(successMsg);
    } catch {
      showToast('فشل حفظ هيكل الأقسام.');
    }
  };

  const handleAddMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMainCatName.trim();
    if (!name) return;
    if (hierarchy.some(g => g.name === name)) {
      showToast(`القسم الرئيسي "${name}" موجود بالفعل.`);
      return;
    }
    const updated = [...hierarchy, { name, subcategories: [] }];
    await saveHierarchy(updated, `تم إنشاء القسم الرئيسي "${name}" بنجاح.`);
    setNewMainCatName('');
  };

  const handleDeleteMainCategory = async (name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم الرئيسي "${name}"؟ سيتم فك ارتباط الفئات الفرعية التابعة له.`)) return;
    const updated = hierarchy.filter(g => g.name !== name);
    await saveHierarchy(updated, `تم حذف القسم الرئيسي "${name}" بنجاح.`);
  };

  const handleAddSubcategory = async (e: React.FormEvent, parentName: string) => {
    e.preventDefault();
    const subName = (newSubCatNames[parentName] || '').trim();
    if (!subName) return;

    // Check if subcategory already exists anywhere
    const exists = hierarchy.some(g => g.name === subName || g.subcategories.includes(subName));
    if (exists) {
      showToast(`الفئة "${subName}" موجودة بالفعل كقسم رئيسي أو فئة فرعية.`);
      return;
    }

    const updated = hierarchy.map(g => {
      if (g.name === parentName) {
        return { ...g, subcategories: [...g.subcategories, subName] };
      }
      return g;
    });

    await saveHierarchy(updated, `تمت إضافة الفئة الفرعية "${subName}" إلى "${parentName}".`);
    setNewSubCatNames(prev => ({ ...prev, [parentName]: '' }));
  };

  const handleDeleteSubcategory = async (subName: string, parentName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الفئة الفرعية "${subName}"؟`)) return;
    const updated = hierarchy.map(g => {
      if (g.name === parentName) {
        return { ...g, subcategories: g.subcategories.filter(s => s !== subName) };
      }
      return g;
    });
    await saveHierarchy(updated, `تم حذف الفئة الفرعية "${subName}" بنجاح.`);
  };

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) return hierarchy;
    const q = searchQuery.toLowerCase();
    return hierarchy.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.subcategories.some(s => s.toLowerCase().includes(q))
    );
  }, [hierarchy, searchQuery]);

  // Paginated hierarchy items
  const totalPages = Math.ceil(filteredHierarchy.length / itemsPerPage);
  const paginatedHierarchy = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHierarchy.slice(start, start + itemsPerPage);
  }, [filteredHierarchy, currentPage]);

  return (
    <div className="space-y-6 font-tajawal">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-on-background border border-primary/20 text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-[fadeInUp_0.2s_ease-out] text-xs font-bold font-sans">
          <span className="material-symbols-outlined text-primary text-base">info</span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
        <div className="text-start">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">إدارة الأقسام والكتالوج</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">قم بإنشاء وتعديل الأقسام الرئيسية والفرعية لتصنيف منتجات المتجر.</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Creation Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <form onSubmit={handleAddMainCategory} className="space-y-4 p-5 bg-white border border-outline-variant/40 rounded-2xl shadow-sm text-start">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider select-none">إضافة قسم رئيسي جديد</h3>
              <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant">اسم القسم الرئيسي</label>
              <input
                type="text"
                placeholder="مثال: كابلات، مفاتيح..."
                value={newMainCatName}
                onChange={(e) => setNewMainCatName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/95 text-on-primary py-2.5 rounded-xl font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/15"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              إنشاء قسم رئيسي
            </button>
          </form>
        </div>

        {/* Categories Tree Accordion List */}
        <div className="xl:col-span-3 bg-white border border-outline-variant/40 rounded-2xl p-6 shadow-sm space-y-6 text-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
            <div>
              <p className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider select-none">هيكل الأقسام الحالي</p>
              <span className="text-[11px] text-on-surface-variant font-bold mt-1 block">({filteredHierarchy.length} أقسام رئيسية)</span>
            </div>
            {/* Search Categories */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="ابحث عن قسم أو فئة فرعية..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl pr-9 pl-4 py-2 text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right font-medium"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] select-none">
                search
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            {paginatedHierarchy.length > 0 ? (
              paginatedHierarchy.map((group) => {
                const isExpanded = expandedGroups.has(group.name);
                const subCount = (group.subcategories || []).length;
                return (
                  <div key={group.name} className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-low transition-all shadow-sm hover:border-outline duration-150">
                    {/* Row Header */}
                    <div
                      onClick={() => toggleGroup(group.name)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-high transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">folder</span>
                        </div>
                        <div className="flex flex-col gap-0.5 text-start">
                          <span className="font-bold text-sm text-on-surface leading-tight">{group.name}</span>
                          <span className="inline-flex self-start text-[9px] font-bold bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md mt-0.5">
                            {subCount} فئات فرعية
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDeleteMainCategory(group.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:bg-error/10 hover:text-error transition-all cursor-pointer border-0 bg-transparent p-0"
                          title={`حذف القسم الرئيسي "${group.name}"`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/60 hover:bg-surface-container-highest transition-all cursor-pointer border-0 bg-transparent p-0"
                        >
                          <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Body */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 bg-white border-t border-outline-variant/20 space-y-4 text-start">
                        {/* Subcategories list */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {subCount > 0 ? (
                            group.subcategories.map((sub: string) => (
                              <div
                                key={sub}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-surface-container-low text-on-surface border border-outline-variant hover:border-primary/30 transition-colors shadow-sm"
                              >
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(sub, group.name)}
                                  className="text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer flex items-center border-0 bg-transparent p-0"
                                  title={`حذف الفئة الفرعية "${sub}"`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-on-surface-variant italic font-bold">لا توجد فئات فرعية مضافة</span>
                          )}
                        </div>

                        {/* Add Subcategory Form */}
                        <form
                          onSubmit={(e) => handleAddSubcategory(e, group.name)}
                          className="flex gap-2 pt-4 border-t border-outline-variant/20 max-w-md text-start"
                        >
                          <input
                            type="text"
                            placeholder="اسم الفئة الفرعية الجديدة..."
                            value={newSubCatNames[group.name] || ''}
                            onChange={(e) => setNewSubCatNames(prev => ({ ...prev, [group.name]: e.target.value }))}
                            className="flex-grow min-w-0 bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right font-bold"
                          />
                          <button
                            type="submit"
                            className="bg-primary hover:bg-primary/95 text-on-primary px-4 py-2 rounded-xl text-xs font-bold active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer shadow-sm shrink-0 border-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            إضافة
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2 select-none">
                  search_off
                </span>
                <p className="text-xs text-on-surface-variant font-bold">لم يتم العثور على أي فئات تطابق البحث.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

      </div>

    </div>
  );
}
