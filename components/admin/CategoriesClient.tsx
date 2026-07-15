'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Toast } from '@/components/ui/Toast';

interface CategoryHierarchyItem {
  name: string;
  icon?: string;
  subcategories: string[];
}

export function CategoriesClient() {
  const { hierarchy, loading, refresh: refreshHierarchy } = useCategoryHierarchy();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isInitialRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('search') || '');
  const [newMainCatName, setNewMainCatName] = useState('');
  const [newSubCatNames, setNewSubCatNames] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams?.get('page');
    return p ? parseInt(p, 10) : 1;
  });
  const itemsPerPage = 6;

  const { confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);



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

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const saveHierarchy = async (updated: CategoryHierarchyItem[], successMsg: string) => {
    try {
      const res = await fetch('/api/category-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Save failed');
      await refreshHierarchy();
      showToast(successMsg);
    } catch {
      showToast('فشل حفظ هيكل الأقسام. يرجى المحاولة مرة أخرى.');
      refreshHierarchy();
    }
  };

  const handleRenameSubmit = () => {
    const { oldName, newName, type, parentName } = renameModal;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setRenameModal(prev => ({ ...prev, isOpen: false }));
      return;
    }

    if (type === 'main') {
      if (hierarchy.some(g => g.name === trimmed && g.name !== oldName)) {
        showToast(`القسم الرئيسي "${trimmed}" موجود بالفعل.`);
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
        showToast(`الفئة "${trimmed}" موجودة بالفعل كقسم رئيسي أو فئة فرعية.`);
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
  };

  const handleAddMainCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMainCatName.trim();
    if (!name) return;
    if (hierarchy.some(g => g.name === name)) {
      showToast(`القسم الرئيسي "${name}" موجود بالفعل.`);
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
  };

  const handleDeleteMainCategory = (name: string) => {
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
  };

  const handleAddSubcategory = (e: React.FormEvent, parentName: string) => {
    e.preventDefault();
    const subName = (newSubCatNames[parentName] || '').trim();
    if (!subName) return;

    const exists = hierarchy.some(g => g.name === subName || g.subcategories.includes(subName));
    if (exists) {
      showToast(`الفئة "${subName}" موجودة بالفعل كقسم رئيسي أو فئة فرعية.`);
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
  };

  const handleDeleteSubcategory = (subName: string, parentName: string) => {
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

  const totalPages = Math.ceil(filteredHierarchy.length / itemsPerPage);
  const paginatedHierarchy = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHierarchy.slice(start, start + itemsPerPage);
  }, [filteredHierarchy, currentPage]);

  if (!isMounted) {
    return (
      <div className="w-full py-20 text-center font-tajawal text-on-surface-variant">
        <p className="text-sm">جاري تحميل إدارة الأقسام...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-tajawal">

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} duration={3000} />
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
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={`sk-cat-${idx}`} className="border border-outline-variant/30 rounded-2xl p-4 bg-surface-container-low animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-outline-variant/20 shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-outline-variant/20 rounded w-24"></div>
                        <div className="h-3 bg-outline-variant/20 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-8 w-8 bg-outline-variant/20 rounded-lg"></div>
                      <div className="h-8 w-8 bg-outline-variant/20 rounded-lg"></div>
                      <div className="h-8 w-8 bg-outline-variant/20 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : paginatedHierarchy.length > 0 ? (
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
                          onClick={() => setRenameModal({ isOpen: true, oldName: group.name, newName: group.name, type: 'main' })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:bg-secondary/10 hover:text-secondary transition-all cursor-pointer border-0 bg-transparent p-0"
                          title={`تعديل اسم القسم "${group.name}"`}
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
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
                        <div className="flex flex-wrap gap-2 pt-2">
                          {subCount > 0 ? (
                            group.subcategories.map((sub: string) => (
                              <div
                                key={sub}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-surface-container-low text-on-surface border border-outline-variant hover:border-primary/30 transition-colors shadow-sm"
                              >
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => setRenameModal({ isOpen: true, oldName: sub, newName: sub, type: 'sub', parentName: group.name })}
                                  className="text-on-surface-variant/40 hover:text-secondary transition-colors cursor-pointer flex items-center border-0 bg-transparent p-0"
                                  title={`تعديل اسم الفئة "${sub}"`}
                                >
                                  <span className="material-symbols-outlined text-[11px]">edit</span>
                                </button>
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

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-outline-variant/20 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.25s_ease-out]">
            <div className="bg-on-background text-white p-5 flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm font-bold">
                {renameModal.type === 'main' ? 'تعديل اسم القسم الرئيسي' : 'تعديل اسم الفئة الفرعية'}
              </h3>
              <button
                onClick={() => setRenameModal(prev => ({ ...prev, isOpen: false }))}
                className="text-white/70 hover:text-white transition-colors cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5 text-start">
                <label className="text-[10px] font-bold text-on-surface-variant">الاسم الجديد</label>
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
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
}
