'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { useProducts } from '@/hooks/useProducts';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { PasswordConfirmModal } from '@/components/ui/PasswordConfirmModal';
import { BANNER_THEMES, getBannerTheme } from '@/lib/utils/color';
import { SubcategoryBannerCard } from '@/components/catalog/SubcategoryBannerCard';
import type { SubcategoryBanner } from '@/types';

/* ───────────────── Custom Grouped Dropdown ───────────────── */
interface GroupedDropdownProps {
  groups: { mainCategory: string; subcategories: string[] }[];
  value: string;
  onChange: (value: string) => void;
  allNames: string[];
}

const GroupedDropdown = memo(function GroupedDropdown({ groups, value, onChange, allNames }: GroupedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setIsOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.map(g => ({
      ...g,
      subcategories: g.subcategories.filter(s => s.toLowerCase().includes(q) || g.mainCategory.toLowerCase().includes(q)),
    })).filter(g => g.subcategories.length > 0);
  }, [groups, search]);

  const parentOf = useMemo(() => {
    for (const g of groups) if (g.subcategories.includes(value)) return g.mainCategory;
    return null;
  }, [groups, value]);

  return (
    <div ref={ref} className="relative w-full font-tajawal" dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border rounded-xl px-4 py-3 text-sm transition-all cursor-pointer ${
          isOpen ? 'border-primary shadow-sm' : 'border-outline-variant/40 hover:border-outline-variant/70'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {value ? (
            <div className="text-right min-w-0">
              <span className="block text-on-surface font-semibold truncate">{value}</span>
              {parentOf && <span className="block text-[10px] text-on-surface-variant/60">{parentOf}</span>}
            </div>
          ) : (
            <span className="text-on-surface-variant/50">-- اختر القسم الفرعي --</span>
          )}
        </div>
        <span className={`material-symbols-outlined text-base text-on-surface-variant/50 transition-transform duration-200 select-none ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-50 overflow-hidden animate-[modalAppear_0.15s_ease-out]">
          <div className="p-2 border-b border-outline-variant/10">
            <input
              ref={inputRef}
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-container-low/50 border-none rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-on-surface-variant/40">لا توجد نتائج</div>
            ) : (
              filtered.map(group => (
                <div key={group.mainCategory}>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider bg-surface-container-low/40 sticky top-0">
                    {group.mainCategory}
                  </div>
                  {group.subcategories.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => { onChange(sub); setIsOpen(false); setSearch(''); }}
                      className={`w-full text-right px-4 py-2 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                        sub === value
                          ? 'bg-primary/5 text-primary font-bold'
                          : 'text-on-surface hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className="truncate">{sub}</span>
                      {sub === value && <span className="material-symbols-outlined text-primary text-sm select-none">check</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
            {value && !allNames.includes(value) && (
              <button
                type="button"
                onClick={() => { onChange(value); setIsOpen(false); }}
                className="w-full text-right px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer"
              >
                {value} (غير موجود)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/* ───────────────── Main Component ───────────────── */
export const DiscountsClient = memo(function DiscountsClient() {
  const { hierarchy, loading: hierarchyLoading } = useCategoryHierarchy();
  const { products } = useProducts();
  const { toast, showSuccess, showError, dismissToast } = useToast();
  const { confirmModal, closeConfirm } = useConfirmModal();

  const [banners, setBanners] = useState<SubcategoryBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SubcategoryBanner | null>(null);
  const [formData, setFormData] = useState({
    subcategory_name: '',
    title: '',
    subtitle: '',
    discount_percentage: '' as string | number,
    discount_badge: '',
    banner_color: 'gradient-primary',
    image_url: '',
    is_active: true,
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeletePasswordModalOpen, setIsDeletePasswordModalOpen] = useState(false);

  const groupedSubcategories = useMemo(() => {
    return hierarchy.map(m => ({ mainCategory: m.name, subcategories: m.subcategories || [] })).filter(g => g.subcategories.length > 0);
  }, [hierarchy]);

  const allSubcategoryNames = useMemo(() => {
    const s = new Set<string>();
    hierarchy.forEach(m => m.subcategories?.forEach(sub => s.add(sub)));
    return Array.from(s);
  }, [hierarchy]);

  const subcategoryImagesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    products.forEach((p) => {
      if (p.category && p.image_url) {
        const existing = map.get(p.category) || [];
        existing.push(p.image_url);
        map.set(p.category, existing);
      }
    });
    return map;
  }, [products]);

  const fetchBanners = useCallback(async () => {
    try {
      setLoadingBanners(true);
      const res = await fetch('/api/admin/discounts');
      if (!res.ok) throw new Error('فشل جلب بنرات الخصومات');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البنرات');
    } finally { setLoadingBanners(false); }
  }, [showError]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const resetForm = useCallback(() => {
    setEditingBanner(null);
    setFormData({ subcategory_name: allSubcategoryNames[0] || '', title: '', subtitle: '', discount_percentage: 15, discount_badge: '', banner_color: 'gradient-primary', image_url: '', is_active: true });
  }, [allSubcategoryNames]);

  const handleOpenCreate = useCallback(() => { resetForm(); setIsModalOpen(true); }, [resetForm]);

  const handleOpenEdit = useCallback((b: SubcategoryBanner) => {
    setEditingBanner(b);
    setFormData({ subcategory_name: b.subcategory_name, title: b.title, subtitle: b.subtitle || '', discount_percentage: b.discount_percentage, discount_badge: b.discount_badge || '', banner_color: b.banner_color || 'gradient-primary', image_url: b.image_url || '', is_active: b.is_active });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subcategory_name) { showError('يرجى اختيار القسم الفرعي المستهدف'); return; }
    if (!formData.title.trim()) { showError('يرجى إدخال عنوان البنر'); return; }
    const pctNum = Number(formData.discount_percentage);
    if (!formData.discount_percentage || isNaN(pctNum) || pctNum < 1 || pctNum > 99) { showError('نسبة الخصم مطلوبة ويجب أن تكون بين 1% و 99%'); return; }
    try {
      setIsSubmitting(true);
      const payload = { subcategory_name: formData.subcategory_name, title: formData.title.trim(), subtitle: formData.subtitle.trim() || null, discount_percentage: pctNum, discount_badge: formData.discount_badge.trim() || null, banner_color: formData.banner_color, image_url: formData.image_url.trim() || null, is_active: formData.is_active };
      const url = editingBanner ? `/api/admin/discounts/${editingBanner.id}` : '/api/admin/discounts';
      const method = editingBanner ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ البنر');
      showSuccess(editingBanner ? 'تم تحديث البنر بنجاح ✨' : 'تم إضافة بنر الخصم بنجاح 🎉');
      setIsModalOpen(false); resetForm(); fetchBanners();
    } catch (err: unknown) { showError(err instanceof Error ? err.message : 'فشل الحفظ'); }
    finally { setIsSubmitting(false); }
  };

  const handleToggleActive = async (banner: SubcategoryBanner) => {
    try {
      const updatedStatus = !banner.is_active;
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: updatedStatus } : b));
      const res = await fetch(`/api/admin/discounts/${banner.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: updatedStatus }) });
      if (!res.ok) { setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: banner.is_active } : b)); showError('فشل تغيير حالة البنر'); return; }
      showSuccess(updatedStatus ? 'تم تفعيل البنر بنجاح' : 'تم إيقاف البنر');
    } catch { fetchBanners(); }
  };

  const handleReqDelete = (id: string) => { setDeleteTargetId(id); setIsDeletePasswordModalOpen(true); };

  const handleConfirmDelete = async (password: string) => {
    if (!deleteTargetId) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/discounts/${deleteTargetId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'كلمة المرور غير صحيحة أو فشل الحذف');
      showSuccess('تم حذف البنر بنجاح 🗑️'); setIsDeletePasswordModalOpen(false); setDeleteTargetId(null); fetchBanners();
    } catch (err: unknown) { showError(err instanceof Error ? err.message : 'فشل حذف البنر'); }
    finally { setIsSubmitting(false); }
  };

  const filteredBanners = useMemo(() => {
    if (!searchQuery.trim()) return banners;
    const q = searchQuery.toLowerCase();
    return banners.filter(b => b.title.toLowerCase().includes(q) || b.subcategory_name.toLowerCase().includes(q) || (b.discount_badge && b.discount_badge.toLowerCase().includes(q)));
  }, [banners, searchQuery]);

  const selectedTheme = useMemo(() => getBannerTheme(formData.banner_color), [formData.banner_color]);

  return (
    <div className="space-y-8 pb-12 font-tajawal">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl select-none">local_offer</span>
            <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">إدارة بنرات الخصومات والعروض</h1>
          </div>
          <p className="text-on-surface-variant font-label-md text-sm">قم بإنشاء بنرات عروض ترويجية مخصصة للأقسام الفرعية واعرض الخصومات المميزة لعملاء المتجر.</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3.5 rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-brand-red-dark active:scale-95 transition-all cursor-pointer text-sm">
          <span className="material-symbols-outlined text-xl select-none">add_circle</span>
          إضافة بنر خصم جديد
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input type="text" placeholder="البحث باسم القسم أو عنوان البنر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface placeholder:text-on-surface-variant/50" />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg select-none">search</span>
        </div>
        <div className="text-xs text-on-surface-variant font-semibold">إجمالي البنرات: <span className="text-primary font-bold text-sm">{banners.length}</span></div>
      </div>

      {/* Grid */}
      {loadingBanners || hierarchyLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
      ) : filteredBanners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant/20 shadow-sm space-y-4">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 select-none">sell</span>
          <p className="text-on-surface-variant font-medium">{searchQuery ? 'لا توجد بنرات تطابق بحثك' : 'لا توجد بنرات خصم حالية. قم بإضافة بنر جديد أولاً!'}</p>
          {!searchQuery && <button onClick={handleOpenCreate} className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-5 py-2.5 rounded-xl font-bold hover:bg-primary/20 transition-all text-xs"><span className="material-symbols-outlined text-base">add</span>إنشاء أول بنر خصم</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBanners.map(banner => (
            <div key={banner.id} className="relative group/card flex flex-col justify-between">
              <SubcategoryBannerCard
                banner={banner}
                categoryImages={subcategoryImagesMap.get(banner.subcategory_name)}
                variant="compact"
              />

              {/* Admin Overlay Actions */}
              <div className="flex items-center justify-between mt-3 bg-white border border-outline-variant/20 rounded-2xl px-4 py-2.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleToggleActive(banner)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    banner.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {banner.is_active ? 'نشط (ظاهر بالمتجر)' : 'معطل (مخفي)'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="flex items-center gap-1 text-xs font-bold text-on-surface bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm select-none">edit</span>
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReqDelete(banner.id)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm select-none">delete</span>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ━━━━━━━ Modal ━━━━━━━ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-[600px] bg-white rounded-2xl shadow-2xl text-right max-h-[92vh] overflow-y-auto animate-[modalSlideUp_0.25s_ease-out]" dir="rtl">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-on-surface">
                {editingBanner ? 'تعديل بنر الخصم' : 'إضافة بنر خصم جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Subcategory */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">القسم الفرعي المستهدف <span className="text-error">*</span></label>
                <GroupedDropdown
                  groups={groupedSubcategories}
                  value={formData.subcategory_name}
                  onChange={val => setFormData(p => ({ ...p, subcategory_name: val }))}
                  allNames={allSubcategoryNames}
                />
                <p className="text-[11px] text-on-surface-variant/60 pr-0.5">سيتم إظهار بنر الخصم عند اختيار هذا القسم الفرعي في صفحة المتجر.</p>
              </div>

              <hr className="border-outline-variant/10" />

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">عنوان البنر الرئيسي <span className="text-error">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: خصم حصري 20% على جميع قواطع الحماية"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface font-medium placeholder:text-on-surface-variant/40"
                  required
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">
                  وصف البنر الفرعي <span className="text-on-surface-variant/40 font-normal">(اختياري)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: احصل على أفضل أسعار الموزع المعتمد لفترة محدودة"
                  value={formData.subtitle}
                  onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                  className="w-full bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface font-medium resize-none placeholder:text-on-surface-variant/40"
                />
              </div>

              <hr className="border-outline-variant/10" />

              {/* Discount % & Badge side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface">نسبة الخصم % <span className="text-error">*</span></label>
                  <input
                    type="number" min="1" max="99" step="0.5" placeholder="15"
                    value={formData.discount_percentage}
                    onChange={e => setFormData(p => ({ ...p, discount_percentage: e.target.value }))}
                    className="w-full bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface font-semibold placeholder:text-on-surface-variant/40"
                    required
                  />
                  <p className="text-[10px] text-on-surface-variant/50">يُطبّق تلقائياً على كافة منتجات هذا القسم.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface">
                    وسام العرض <span className="text-on-surface-variant/40 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="text" placeholder="مثال: عرض لفترة محدودة"
                    value={formData.discount_badge}
                    onChange={e => setFormData(p => ({ ...p, discount_badge: e.target.value }))}
                    className="w-full bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface font-medium placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>

              <hr className="border-outline-variant/10" />

              {/* Color Theme */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface">لون البنر</label>
                <div className="grid grid-cols-3 gap-2">
                  {BANNER_THEMES.map(theme => {
                    const sel = formData.banner_color === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, banner_color: theme.id }))}
                        className={`relative bg-gradient-to-l ${theme.gradientClass} rounded-lg px-3 py-2 text-xs font-bold ${theme.textClass} transition-all cursor-pointer flex items-center justify-between gap-1 ${
                          sel ? 'ring-2 ring-offset-1 ring-primary shadow-md scale-[1.02]' : 'opacity-75 hover:opacity-95'
                        }`}
                      >
                        <span className="truncate">{theme.name}</span>
                        {sel && <span className="material-symbols-outlined text-sm shrink-0 select-none">check_circle</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-outline-variant/10" />

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-bold text-on-surface">تفعيل البنر والخصم فوراً</span>
                  <p className="text-[11px] text-on-surface-variant/60">عند التفعيل، سيظهر البنر ويُطبّق الخصم مباشرة.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_active}
                  onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${formData.is_active ? 'bg-primary' : 'bg-on-surface-variant/25'}`}
                >
                  <span className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform duration-200 ${formData.is_active ? 'translate-x-1' : 'translate-x-[1.375rem]'}`} />
                </button>
              </div>

              <hr className="border-outline-variant/10" />

              {/* Live Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant/60">معاينة البنر الحية</label>
                <SubcategoryBannerCard
                  banner={formData}
                  categoryImages={subcategoryImagesMap.get(formData.subcategory_name)}
                  variant="compact"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-bold text-xs transition-all cursor-pointer"
                >إلغاء</button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20 hover:bg-brand-red-dark active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Spinner className="w-4 h-4 text-on-primary animate-spin" /> : <span className="material-symbols-outlined text-base select-none">save</span>}
                  {editingBanner ? 'تحديث البنر' : 'حفظ ونشر البنر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PasswordConfirmModal isOpen={isDeletePasswordModalOpen} onCancel={() => { setIsDeletePasswordModalOpen(false); setDeleteTargetId(null); }} onConfirm={handleConfirmDelete} title="تأكيد حذف بنر الخصم" message="هذا الإجراء سيقوم بحذف بنر الخصم بشكل نهائي. يرجى إدخال كلمة مرور المسؤول للتأكيد." />
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
    </div>
  );
});
