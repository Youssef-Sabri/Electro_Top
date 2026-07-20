'use client';

import React, { memo, useState, useMemo, useRef, useEffect, useDeferredValue, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useHydrated } from '@/hooks/useHydrated';
import { useToast } from '@/hooks/useToast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { CategoryGroupCard } from '@/components/admin/CategoryGroupCard';

export interface CategoryHierarchyItem {
  name: string;
  icon?: string;
  subcategories: string[];
}

export const CategoriesClient = memo(function CategoriesClient() {
  const { hierarchy, loading, refresh: refreshHierarchy } = useCategoryHierarchy();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isInitialRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('search') || '');
  const deferredSearch = useDeferredValue(searchQuery);
  const [newMainCatName, setNewMainCatName] = useState('');
  const [newSubCatNames, setNewSubCatNames] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams?.get('page');
    return p ? parseInt(p, 10) : 1;
  });
  const itemsPerPage = 6;

  const { confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const isMounted = useHydrated();
  const { toast, showSuccess, dismissToast } = useToast();



  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    oldName: string;
    newName: string;
    type: 'main' | 'sub';
    parentName?: string;
  }>({
    isOpen: false,
    oldName: '',
    newName: '',
    type: 'main',
  });
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renameModal.isOpen && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameModal.isOpen]);

  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (pathname !== '/admin/categories') return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (searchQuery === '') params.delete('search');
    else params.set('search', searchQuery);

    if (currentPage === 1) params.delete('page');
    else params.set('page', currentPage.toString());

    const nextUrl = `${pathname}?${params.toString()}`;
    if (`?${params.toString()}` !== window.location.search) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [searchQuery, currentPage, pathname]);

  // Sync URL query params back to state (for back/forward navigation and link resets)
  useEffect(() => {
    if (pathname !== '/admin/categories') return;
    const urlSearch = searchParams?.get('search') || '';
    const urlPage = searchParams?.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

    setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
    setCurrentPage((prev) => (prev === urlPage ? prev : urlPage));
  }, [searchParams, pathname]);

  const saveHierarchy = useCallback(async (updated: CategoryHierarchyItem[], successMsg: string) => {
    try {
      const res = await fetch('/api/category-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Save failed');
      await refreshHierarchy(true);
      showSuccess(successMsg);
    } catch {
      showSuccess('فشل حفظ هيكل الأقسام. يرجى المحاولة مرة أخرى.');
      refreshHierarchy(true);
    }
  }, [refreshHierarchy, showSuccess]);

  const handleRenameSubmit = useCallback(() => {
    const { oldName, newName, type, parentName } = renameModal;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setRenameModal(prev => ({ ...prev, isOpen: false }));
      return;
    }

    if (type === 'main') {
      if (hierarchy.some(g => g.name === trimmed && g.name !== oldName)) {
        showSuccess(`القسم الرئيسي "${trimmed}" موجود بالفعل.`);
        return;
      }
      openConfirm({
        title: 'تعديل اسم القسم الرئيسي',
        message: `هل أنت متأكد من تغيير اسم القسم من "${oldName}" إلى "${trimmed}"؟ سيتم تحديث جميع المنتجات المرتبطة.`,
        confirmLabel: 'نعم، عدّل الاسم',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          closeConfirm();
          setRenameModal(prev => ({ ...prev, isOpen: false }));
          const updated = hierarchy.map(g => {
            if (g.name === oldName) return { ...g, name: trimmed };
            return g;
          });
          await saveHierarchy(updated, `تم تغيير اسم القسم من "${oldName}" إلى "${trimmed}".`);
        },
      });
    } else {
      const existsElsewhere = hierarchy.some(g =>
        g.name === trimmed || (g.name !== parentName && g.subcategories.includes(trimmed))
      );
      if (existsElsewhere) {
        showSuccess(`الفئة "${trimmed}" موجودة بالفعل كقسم رئيسي أو فئة فرعية.`);
        return;
      }
      openConfirm({
        title: 'تعديل اسم الفئة الفرعية',
        message: `هل أنت متأكد من تغيير اسم الفئة من "${oldName}" إلى "${trimmed}"؟ سيتم تحديث جميع المنتجات المرتبطة.`,
        confirmLabel: 'نعم، عدّل الاسم',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          closeConfirm();
          setRenameModal(prev => ({ ...prev, isOpen: false }));
          const updated = hierarchy.map(g => {
            if (g.name === parentName) {
              return { ...g, subcategories: g.subcategories.map(s => s === oldName ? trimmed : s) };
            }
            return g;
          });
          await saveHierarchy(updated, `تم تغيير اسم الفئة من "${oldName}" إلى "${trimmed}".`);
        },
      });
    }
  }, [renameModal, hierarchy, openConfirm, closeConfirm, saveHierarchy, showSuccess]);

  const handleAddMainCategory = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const name = newMainCatName.trim();
    if (!name) return;
    if (hierarchy.some(g => g.name === name)) {
      showSuccess(`القسم الرئيسي "${name}" موجود بالفعل.`);
      return;
    }
    openConfirm({
      title: 'إضافة قسم رئيسي',
      message: `هل أنت متأكد من إضافة القسم الرئيسي "${name}"؟`,
      confirmLabel: 'نعم، أضف القسم',
      cancelLabel: 'إلغاء',
      onConfirm: async () => {
        closeConfirm();
        const updated = [...hierarchy, { name, subcategories: [] }];
        await saveHierarchy(updated, `تم إنشاء القسم الرئيسي "${name}" بنجاح.`);
        setNewMainCatName('');
      },
    });
  }, [newMainCatName, hierarchy, openConfirm, closeConfirm, saveHierarchy, showSuccess]);

  const handleDeleteMainCategory = useCallback((name: string) => {
    openConfirm({
      title: 'حذف القسم الرئيسي',
      message: `هل أنت متأكد من حذف القسم الرئيسي "${name}"؟ سيتم فك ارتباط الفئات الفرعية التابعة له.`,
      confirmLabel: 'نعم، احذف القسم',
      cancelLabel: 'إلغاء',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        const updated = hierarchy.filter(g => g.name !== name);
        await saveHierarchy(updated, `تم حذف القسم الرئيسي "${name}" بنجاح.`);
      },
    });
  }, [openConfirm, closeConfirm, hierarchy, saveHierarchy]);

  const handleAddSubcategory = useCallback((e: React.FormEvent, parentName: string) => {
    e.preventDefault();
    const subName = (newSubCatNames[parentName] || '').trim();
    if (!subName) return;

    const exists = hierarchy.some(g => g.name === subName || g.subcategories.includes(subName));
    if (exists) {
      showSuccess(`الفئة "${subName}" موجودة بالفعل كقسم رئيسي أو فئة فرعية.`);
      return;
    }

    openConfirm({
      title: 'إضافة فئة فرعية',
      message: `هل أنت متأكد من إضافة الفئة الفرعية "${subName}" إلى "${parentName}"؟`,
      confirmLabel: 'نعم، أضف الفئة',
      cancelLabel: 'إلغاء',
      onConfirm: async () => {
        closeConfirm();
        const updated = hierarchy.map(g => {
          if (g.name === parentName) {
            return { ...g, subcategories: [...g.subcategories, subName] };
          }
          return g;
        });
        await saveHierarchy(updated, `تمت إضافة الفئة الفرعية "${subName}" إلى "${parentName}".`);
        setNewSubCatNames(prev => ({ ...prev, [parentName]: '' }));
      },
    });
  }, [newSubCatNames, hierarchy, openConfirm, closeConfirm, showSuccess, saveHierarchy]);

  const handleDeleteSubcategory = useCallback((subName: string, parentName: string) => {
    openConfirm({
      title: 'حذف الفئة الفرعية',
      message: `هل أنت متأكد من حذف الفئة الفرعية "${subName}" من "${parentName}"؟`,
      confirmLabel: 'نعم، احذف الفئة',
      cancelLabel: 'إلغاء',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        const updated = hierarchy.map(g => {
          if (g.name === parentName) {
            return { ...g, subcategories: g.subcategories.filter(s => s !== subName) };
          }
          return g;
        });
        await saveHierarchy(updated, `تم حذف الفئة الفرعية "${subName}" بنجاح.`);
      },
    });
  }, [openConfirm, closeConfirm, hierarchy, saveHierarchy]);

  const toggleGroup = useCallback((name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const filteredHierarchy = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return hierarchy;

    const mainMatches = (g: CategoryHierarchyItem) => g.name.toLowerCase().includes(q);
    const subMatches = (g: CategoryHierarchyItem) => g.subcategories.some(s => s.toLowerCase().includes(q));
    const mainStarts = (g: CategoryHierarchyItem) => g.name.toLowerCase().startsWith(q);

    const matched = hierarchy.filter(g => mainMatches(g) || subMatches(g));
    matched.sort((a, b) => {
      const aScore = mainStarts(a) ? 0 : mainMatches(a) ? 1 : 2;
      const bScore = mainStarts(b) ? 0 : mainMatches(b) ? 1 : 2;
      if (aScore !== bScore) return aScore - bScore;
      return a.name.localeCompare(b.name, 'ar', { numeric: true, sensitivity: 'base' });
    });
    return matched;
  }, [hierarchy, deferredSearch]);

  const totalPages = Math.ceil(filteredHierarchy.length / itemsPerPage);
  const paginatedHierarchy = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHierarchy.slice(start, start + itemsPerPage);
  }, [filteredHierarchy, currentPage]);

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);

  const groupCallbacks = useMemo(() =>
    paginatedHierarchy.map(group => ({
      name: group.name,
      onToggle: () => toggleGroup(group.name),
      onRenameMain: () => setRenameModal({ isOpen: true, oldName: group.name, newName: group.name, type: 'main' as const }),
      onDeleteMain: () => handleDeleteMainCategory(group.name),
      onRenameSub: (subName: string) => setRenameModal({ isOpen: true, oldName: subName, newName: subName, type: 'sub' as const, parentName: group.name }),
      onDeleteSub: (subName: string) => handleDeleteSubcategory(subName, group.name),
      onAddSub: (e: React.FormEvent) => handleAddSubcategory(e, group.name),
      onSubInputChange: (val: string) => setNewSubCatNames(prev => ({ ...prev, [group.name]: val })),
    })),
    [paginatedHierarchy, toggleGroup, handleDeleteMainCategory, handleDeleteSubcategory, handleAddSubcategory]
  );

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-tajawal text-on-surface-variant">
        <Spinner className="h-8 w-8 mb-3" />
        <p className="text-sm">جاري تحميل إدارة الأقسام...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-tajawal">

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} duration={3000} />
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
              <label htmlFor="new-main-cat-name" className="text-[10px] font-bold text-on-surface-variant">اسم القسم الرئيسي</label>
              <input
                id="new-main-cat-name"
                type="text"
                placeholder="مثال: كابلات، مفاتيح..."
                value={newMainCatName}
                onChange={(e) => setNewMainCatName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start"
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
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor="categories-search" className="sr-only">بحث في الأقسام</label>
              <input
                id="categories-search"
                type="text"
                placeholder="ابحث عن قسم أو فئة فرعية..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl pr-9 pl-4 py-2 text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start font-medium"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] select-none">
                search
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={`sk-cat-${idx}`} className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))
            ) : paginatedHierarchy.length > 0 ? (
              groupCallbacks.map((cb) => {
                const group = paginatedHierarchy.find(g => g.name === cb.name)!;
                return (
                  <CategoryGroupCard
                    key={cb.name}
                    group={group}
                    isExpanded={expandedGroups.has(cb.name)}
                    subCount={(group.subcategories || []).length}
                    subCatInputValue={newSubCatNames[cb.name] || ''}
                    onToggle={cb.onToggle}
                    onRenameMain={cb.onRenameMain}
                    onDeleteMain={cb.onDeleteMain}
                    onRenameSub={cb.onRenameSub}
                    onDeleteSub={cb.onDeleteSub}
                    onAddSub={cb.onAddSub}
                    onSubInputChange={cb.onSubInputChange}
                  />
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

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

      </div>

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

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="تعديل اسم القسم">
          <div className="bg-white border border-outline-variant/20 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.25s_ease-out]">
            <div className="bg-on-background text-white p-5 flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm font-bold">
                {renameModal.type === 'main' ? 'تعديل اسم القسم الرئيسي' : 'تعديل اسم الفئة الفرعية'}
              </h3>
              <button
                onClick={() => setRenameModal(prev => ({ ...prev, isOpen: false }))}
                className="text-white/70 hover:text-white transition-colors cursor-pointer flex items-center"
                aria-label="إغلاق"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5 text-start">
                <label htmlFor="rename-category-input" className="text-[10px] font-bold text-on-surface-variant">الاسم الجديد</label>
                <input
                  id="rename-category-input"
                  ref={renameInputRef}
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start"
                />
              </div>
            </div>
            <div className="bg-surface-container-low p-4 flex gap-3 justify-end border-t border-outline-variant/20">
              <button
                onClick={() => setRenameModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-bold"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
