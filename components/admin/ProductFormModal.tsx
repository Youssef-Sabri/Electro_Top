'use client';

import { memo, useCallback } from 'react';
import type { Product, CategoryGroup } from '@/types';
import type { ProductFormData } from '@/lib/validations';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ALL_COLORS } from '@/lib/utils/color';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  isSaving: boolean;
  formData: Omit<ProductFormData, 'price' | 'stock'> & { price: number | ''; stock: number | '' };
  formErrors: Partial<Record<keyof ProductFormData, string>>;
  formMainCategory: string;
  hierarchy: CategoryGroup[];
  isCompressing: boolean;
  isCompressing2: boolean;
  isCompressing3: boolean;
  compressionInfo: string | null;
  compressionInfo2: string | null;
  compressionInfo3: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>, slot: 0 | 1 | 2) => void;
  onSetAsMainImage: (slot: 1 | 2) => void;
  onSetFormMainCategory: (val: string) => void;
  onSetFormData: React.Dispatch<React.SetStateAction<Omit<ProductFormData, 'price' | 'stock'> & { price: number | ''; stock: number | '' }>>;
  onSetFormErrors: (errors: Partial<Record<keyof ProductFormData, string>>) => void;
}

export const ProductFormModal = memo(function ProductFormModal({
  isOpen,
  editingProduct,
  isSaving,
  formData,
  formErrors,
  formMainCategory,
  hierarchy,
  isCompressing,
  isCompressing2,
  isCompressing3,
  compressionInfo,
  compressionInfo2,
  compressionInfo3,
  onClose,
  onSubmit,
  onInputChange,
  onCheckboxChange,
  onImageFileChange,
  onSetAsMainImage,
  onSetFormMainCategory,
  onSetFormData,
  onSetFormErrors,
}: ProductFormModalProps) {
  const handleMainCategoryChange = useCallback((val: string) => {
    onSetFormMainCategory(val);
    onSetFormData(prev => ({ ...prev, category: val }));
    if (formErrors.category) {
      onSetFormErrors({ ...formErrors, category: undefined });
    }
  }, [onSetFormMainCategory, onSetFormData, onSetFormErrors, formErrors]);

  const handleSubCategoryChange = useCallback((val: string) => {
    onSetFormData(prev => ({ ...prev, category: val }));
    if (formErrors.category) {
      onSetFormErrors({ ...formErrors, category: undefined });
    }
  }, [onSetFormData, onSetFormErrors, formErrors]);

  if (!isOpen) return null;

  return (
    <>
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-[110] font-tajawal">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-outline-variant/30 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-primary text-[48px] animate-spin select-none">sync</span>
            <div>
              <p className="font-bold text-on-surface">جاري حفظ بيانات المنتج...</p>
              <p className="text-xs text-on-surface-variant mt-1">يرجى الانتظار وعدم إغلاق الصفحة.</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label={editingProduct ? 'تعديل تفاصيل المنتج' : 'إضافة منتج جديد'}>
        <div
          className="bg-white border border-outline-variant/20 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.25s_ease-out] max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-on-background text-white p-6 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md font-bold">
              {editingProduct ? 'تعديل تفاصيل المنتج' : 'إضافة منتج جديد'}
            </h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors cursor-pointer flex items-center"
              aria-label="إغلاق"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-6 text-start overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="product-name" className="font-label-md text-on-surface block font-bold">اسم المنتج</label>
                <input
                  id="product-name"
                  className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                    formErrors.name ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
                  }`}
                  name="name"
                  placeholder="مثال: شنايدر Easy9 قاطع ثلاثي 16 أمبير"
                  type="text"
                  value={formData.name}
                  onChange={onInputChange}
                />
                {formErrors.name && (
                  <p className="text-xs text-error font-medium">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="صورة المنتج الرئيسية"
                  slot="image_url"
                  currentUrl={formData.image_url}
                  previewUrl={isCompressing ? null : formData.image_url || null}
                  isUploading={isCompressing}
                  onFileChange={(e) => onImageFileChange(e, 0)}
                />
                {compressionInfo && !formErrors.image_url && (
                  <p className="text-[11px] text-[var(--color-status-delivered)] font-medium flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                    {compressionInfo}
                  </p>
                )}
                {formErrors.image_url && (
                  <p className="text-xs text-error font-medium mt-1">{formErrors.image_url}</p>
                )}
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="صورة إضافية 1 (اختياري)"
                  slot="image_url_2"
                  currentUrl={formData.image_url_2 || ''}
                  previewUrl={isCompressing2 ? null : formData.image_url_2 || null}
                  isUploading={isCompressing2}
                  onFileChange={(e) => onImageFileChange(e, 1)}
                  onSetAsMain={formData.image_url_2 ? () => onSetAsMainImage(1) : undefined}
                />
                {compressionInfo2 && !formErrors.image_url_2 && (
                  <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                    {compressionInfo2}
                  </p>
                )}
                {formErrors.image_url_2 && (
                  <p className="text-xs text-error font-medium mt-1">{formErrors.image_url_2}</p>
                )}
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="صورة إضافية 2 (اختياري)"
                  slot="image_url_3"
                  currentUrl={formData.image_url_3 || ''}
                  previewUrl={isCompressing3 ? null : formData.image_url_3 || null}
                  isUploading={isCompressing3}
                  onFileChange={(e) => onImageFileChange(e, 2)}
                  onSetAsMain={formData.image_url_3 ? () => onSetAsMainImage(2) : undefined}
                />
                {compressionInfo3 && !formErrors.image_url_3 && (
                  <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                    {compressionInfo3}
                  </p>
                )}
                {formErrors.image_url_3 && (
                  <p className="text-xs text-error font-medium mt-1">{formErrors.image_url_3}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="product-price" className="font-label-md text-on-surface block font-bold">السعر (ج.م)</label>
                <input
                  id="product-price"
                  className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                    formErrors.price ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
                  }`}
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={onInputChange}
                />
                {formErrors.price && (
                  <p className="text-xs text-error font-medium">{formErrors.price}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="product-stock" className="font-label-md text-on-surface block font-bold">الكمية المتوفرة</label>
                <input
                  id="product-stock"
                  className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                    formErrors.stock ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
                  }`}
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={onInputChange}
                />
                {formErrors.stock && (
                  <p className="text-xs text-error font-medium">{formErrors.stock}</p>
                )}
              </div>

              <div className="space-y-1 text-start">
                <label htmlFor="product-main-category" className="font-label-md text-on-surface block font-bold">القسم الرئيسي</label>
                <CustomDropdown
                  id="product-main-category"
                  ariaLabel="القسم الرئيسي"
                  options={[
                    { value: '', label: 'اختر القسم الرئيسي' },
                    ...hierarchy.map(g => ({ value: g.name, label: g.name }))
                  ]}
                  value={formMainCategory}
                  onChange={handleMainCategoryChange}
                  className="w-full"
                />
              </div>

              <div className="space-y-1 text-start">
                <label htmlFor="product-sub-category" className="font-label-md text-on-surface block font-bold">الفئة الفرعية</label>
                <CustomDropdown
                  id="product-sub-category"
                  ariaLabel="الفئة الفرعية"
                  options={[
                    { value: '', label: 'اختر الفئة الفرعية' },
                    ...((hierarchy.find(g => g.name === formMainCategory)?.subcategories || []).map((sub: string) => ({ value: sub, label: sub })))
                  ]}
                  value={formData.category || ''}
                  onChange={handleSubCategoryChange}
                  className="w-full"
                />
                {formErrors.category && (
                  <p className="text-xs text-error font-medium">{formErrors.category}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-description" className="font-label-md text-on-surface block font-bold">الوصف</label>
              <textarea
                id="product-description"
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md h-24 ${
                  formErrors.description ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
                }`}
                name="description"
                placeholder="أدخل المواصفات الفنية، الماركة، عدد الأقطاب، شدة التيار، سعة القطع، أو مقاس السلك..."
                value={formData.description}
                onChange={onInputChange}
              />
              {formErrors.description && (
                <p className="text-xs text-error font-medium">{formErrors.description}</p>
              )}
            </div>

            <div className="flex items-center gap-6 bg-surface-container-low p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  id="modal-is-active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={onCheckboxChange}
                  className="w-5 h-5 rounded border-outline focus:ring-primary text-primary cursor-pointer accent-primary"
                />
                <label htmlFor="modal-is-active" className="font-bold text-sm text-on-surface cursor-pointer select-none">
                  نشط
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="modal-has-colors"
                  name="has_colors"
                  type="checkbox"
                  checked={formData.has_colors}
                  onChange={onCheckboxChange}
                  className="w-5 h-5 rounded border-outline focus:ring-primary text-primary cursor-pointer accent-primary"
                />
                <label htmlFor="modal-has-colors" className="font-bold text-sm text-on-surface cursor-pointer select-none">
                  يتطلب اختيار لون
                </label>
              </div>
            </div>

            {formData.has_colors && (
              <div className="bg-surface-container-low p-4 rounded-lg">
                <label className="font-bold text-sm text-on-surface block mb-3">
                  الألوان المتاحة <span className="text-electro-red">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_COLORS.map((color) => {
                    const isSelected = (formData.colors ?? []).includes(color.name);
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          onSetFormData((prev) => ({
                            ...prev,
                            colors: isSelected
                              ? (prev.colors ?? []).filter((c) => c !== color.name)
                              : [...(prev.colors ?? []), color.name],
                          }));
                          if (formErrors.colors) {
                            onSetFormErrors({ ...formErrors, colors: undefined });
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/10 font-bold'
                            : 'border-outline-variant/60 hover:border-outline text-on-surface-variant'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-outline-variant shadow-sm shrink-0"
                          style={{ background: color.hex, borderColor: color.name === 'أبيض' ? '#D1D5DB' : undefined }}
                        />
                        <span>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
                {formErrors.colors && (
                  <p className="text-xs text-error font-medium mt-2">{formErrors.colors}</p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-bold uppercase tracking-wider"
              >
                {editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
});
