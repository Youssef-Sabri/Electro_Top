'use client';

import { memo, useState, useEffect } from 'react';
import type { Product } from '../../types';
import { ProductFormData, productFormSchema } from '../../lib/validators';
import { CustomDropdown } from '../ui/CustomDropdown';
import { processAndCompressImage, uploadProductImage, deleteProductImage } from '../../lib/image-utils';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (product: Product | Omit<Product, 'id' | 'created_at'>) => Promise<void>;
}

export const ProductFormModal = memo(function ProductFormModal({
  isOpen,
  editingProduct,
  categories,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<Omit<ProductFormData, 'price' | 'stock'> & { price: number | ''; stock: number | ''; }>({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    is_active: true,
    category: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        stock: editingProduct.stock,
        image_url: editingProduct.image_url,
        is_active: editingProduct.is_active,
        category: editingProduct.category || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        image_url: '',
        is_active: true,
        category: '',
      });
    }
    setSelectedImageFile(null);
    setCompressionInfo(null);
    setFormErrors({});
  }, [editingProduct, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? (value ? parseFloat(value) : '') : value,
    }));
    if (formErrors[name as keyof ProductFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressionInfo(null);
    setFormErrors((prev) => ({ ...prev, image_url: undefined }));

    try {
      const compressed = await processAndCompressImage(file);
      const dataUrl = compressed.dataUrl;
      const info = compressed.info;

      setFormData((prev) => ({ ...prev, image_url: dataUrl }));
      setSelectedImageFile(file);
      setCompressionInfo(info);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ في معالجة الصورة';
      setFormErrors((prev) => ({ ...prev, image_url: errorMsg }));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const formToValidate = {
      ...formData,
      price: formData.price === '' ? 0 : formData.price,
      stock: formData.stock === '' ? 0 : formData.stock,
    };

    const result = productFormSchema.safeParse(formToValidate);
    if (!result.success) {
      const errorMap: Partial<Record<keyof ProductFormData, string>> = {};
      result.error.issues.forEach((e) => {
        const path = e.path[0] as keyof ProductFormData;
        errorMap[path] = e.message;
      });
      setFormErrors(errorMap);
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = formData.image_url;

      if (selectedImageFile && formData.image_url.startsWith('data:')) {
        const { imageUrl } = await uploadProductImage(selectedImageFile);
        finalImageUrl = imageUrl;

        if (editingProduct?.image_url && !editingProduct.image_url.startsWith('data:')) {
          try {
            await deleteProductImage(editingProduct.image_url);
          } catch {
            // Silently fail on old image deletion
          }
        }
      }

      const productData: Product | Omit<Product, 'id' | 'created_at'> = {
        ...result.data,
        image_url: finalImageUrl,
        ...(editingProduct && { id: editingProduct.id, created_at: editingProduct.created_at }),
      };

      await onSubmit(productData);
      onClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ المنتج';
      setFormErrors((prev) => ({ ...prev, image_url: errorMsg }));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-white border border-outline-variant/20 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.25s_ease-out] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-on-background text-white p-6 flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md font-bold">
            {editingProduct ? 'تعديل تفاصيل المنتج' : 'إضافة منتج جديد'}
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-start overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="space-y-1">
              <label className="font-label-md text-on-surface block font-bold">اسم المنتج</label>
              <input
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                  formErrors.name ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
                }`}
                name="name"
                placeholder="مثال: شنايدر Easy9 قاطع ثلاثي 16 أمبير"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
              />
              {formErrors.name && (
                <p className="text-xs text-error font-medium">{formErrors.name}</p>
              )}
            </div>

            {/* Product Image Upload */}
            <div className="space-y-1">
              <label className="font-label-md text-on-surface block font-bold">صورة المنتج</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isCompressing}
                  className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container-low file:text-primary hover:file:bg-surface-container-medium cursor-pointer disabled:opacity-60"
                />
                {isCompressing && (
                  <span className="text-xs text-primary font-medium flex items-center gap-1 shrink-0 animate-pulse">
                    <span className="material-symbols-outlined text-base select-none">architecture</span>
                    جاري معالجة الصورة...
                  </span>
                )}
                {!isCompressing && formData.image_url && (
                  <div className="relative w-12 h-12 rounded border border-outline-variant/30 overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data-URI preview */}
                    <img
                      src={formData.image_url}
                      alt="Product Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
              {compressionInfo && !formErrors.image_url && (
                <p className="text-[11px] text-green-600 font-medium flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                  {compressionInfo}
                </p>
              )}
              {formErrors.image_url && (
                <p className="text-xs text-error font-medium mt-1">{formErrors.image_url}</p>
              )}
            </div>

            {/* Price (EGP) */}
            <div className="space-y-1">
              <label className="font-label-md text-on-surface block font-bold">السعر (ج.م)</label>
              <input
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                  formErrors.price ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
                }`}
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
              />
              {formErrors.price && (
                <p className="text-xs text-error font-medium">{formErrors.price}</p>
              )}
            </div>

            {/* Stock Quantity */}
            <div className="space-y-1">
              <label className="font-label-md text-on-surface block font-bold">الكمية المتوفرة</label>
              <input
                className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                  formErrors.stock ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
                }`}
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
              />
              {formErrors.stock && (
                <p className="text-xs text-error font-medium">{formErrors.stock}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="font-label-md text-on-surface block font-bold">الفئة</label>
              <CustomDropdown
                options={[
                  { value: '', label: 'غير محدد (عام)' },
                  ...categories.map(cat => ({ value: cat, label: cat }))
                ]}
                value={formData.category || ''}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, category: val }));
                  if (formErrors.category) {
                    setFormErrors(prev => ({ ...prev, category: undefined }));
                  }
                }}
                className="w-full"
              />
              {formErrors.category && (
                <p className="text-xs text-error font-medium">{formErrors.category}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-label-md text-on-surface block font-bold">الوصف</label>
            <textarea
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md h-24 ${
                formErrors.description ? 'border-error ring-1 ring-error/20' : 'border-gray-300'
              }`}
              name="description"
              placeholder="أدخل المواصفات الفنية، الماركة، عدد الأقطاب، شدة التيار، سعة القطع، أو مقاس السلك..."
              value={formData.description}
              onChange={handleInputChange}
            />
            {formErrors.description && (
              <p className="text-xs text-error font-medium">{formErrors.description}</p>
            )}
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-lg">
            <input
              id="modal-is-active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleCheckboxChange}
              className="w-5 h-5 rounded border-outline focus:ring-primary text-primary cursor-pointer accent-primary"
            />
            <label htmlFor="modal-is-active" className="font-bold text-sm text-on-surface cursor-pointer select-none">
              جعل المنتج مرئياً في كتالوج المتجر (نشط)
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-bold uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'جاري الحفظ...' : (editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
