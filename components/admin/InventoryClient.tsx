'use client';

import { memo, useState, useMemo, useEffect, useDeferredValue } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { useCategoryHierarchy } from '@/hooks/useCategoryHierarchy';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency } from '@/lib/format-currency';
import { todayStamp } from '@/lib/date-utils';
import type { Product } from '@/types';
import { ProductFormData, productFormSchema } from '@/lib/validators';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PasswordConfirmModal } from '@/components/ui/PasswordConfirmModal';
import { Toast } from '@/components/ui/Toast';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { exportToCSV } from '@/lib/csv-export';
import { uploadProductImage, processAndCompressImage, deleteProductImage } from '@/lib/image-utils';
import { ALL_COLORS } from '@/lib/color-palette';

export const InventoryClient = memo(function InventoryClient() {

  const { products, addProduct, updateProduct, deleteProduct, clearAllProducts } = useProducts();
  const { hierarchy } = useCategoryHierarchy();

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'out' | 'low' | 'instock'>('all');
  const [selectedMainCategoryFilter, setSelectedMainCategoryFilter] = useState('all');
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isCompressing2, setIsCompressing2] = useState(false);
  const [isCompressing3, setIsCompressing3] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [compressionInfo2, setCompressionInfo2] = useState<string | null>(null);
  const [compressionInfo3, setCompressionInfo3] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImageFile2, setSelectedImageFile2] = useState<File | null>(null);
  const [selectedImageFile3, setSelectedImageFile3] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Omit<ProductFormData, 'price' | 'stock'> & { price: number | ''; stock: number | ''; }>({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    image_url_2: '',
    image_url_3: '',
    is_active: true,
    has_colors: false,
    colors: [] as string[],
    category: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});



  const [isClearProductsPasswordOpen, setIsClearProductsPasswordOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const [selectedMainCategory, setSelectedMainCategory] = useState('');



  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    return { total, active, outOfStock, totalStock };
  }, [products]);

  const activeFilterCategories = useMemo(() => {
    if (selectedMainCategoryFilter === 'all') return null;
    if (selectedSubCategoryFilter === 'all') {
      const group = hierarchy.find(h => h.name === selectedMainCategoryFilter);
      if (group) {
        return [selectedMainCategoryFilter, ...(group.subcategories || [])];
      }
      return [selectedMainCategoryFilter];
    }
    return [selectedSubCategoryFilter];
  }, [selectedMainCategoryFilter, selectedSubCategoryFilter, hierarchy]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(deferredSearchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'out' && p.stock === 0) ||
        (stockFilter === 'low' && p.stock > 0 && p.stock <= 5) ||
        (stockFilter === 'instock' && p.stock > 5);

      const matchesCategory =
        !activeFilterCategories ||
        (!!p.category && activeFilterCategories.includes(p.category));

      return matchesSearch && matchesStatus && matchesStock && matchesCategory;
    });
  }, [products, deferredSearchQuery, statusFilter, stockFilter, activeFilterCategories]);

  const itemsPerPage = 10;
  const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedProducts, resetPage } = usePagination(filteredProducts, itemsPerPage);

  useEffect(() => {
    resetPage();
  }, [searchQuery, statusFilter, stockFilter, selectedMainCategoryFilter, selectedSubCategoryFilter, resetPage]);

  const handleExportCSV = () => {
    const headers = [
      'معرف المنتج',
      'اسم المنتج',
      'الفئة',
      'السعر (ج.م)',
      'كمية المخزون',
      'الحالة',
      'الوصف'
    ];

    const rows = products.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.stock,
      product.is_active ? 'نشط' : 'غير نشط',
      product.description
    ]);

    const dateStamp = todayStamp();
    exportToCSV({
      filename: `electro-top-inventory-${dateStamp}.csv`,
      headers,
      rows,
    });
  };

  const handleClearAllProducts = () => {
    setConfirmModal({
      isOpen: true,
      title: 'مسح المخزون بالكامل',
      message: 'هل أنت متأكد من رغبتك في حذف جميع المنتجات في المخزون نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.',
      confirmLabel: 'نعم، امسح كل المنتجات',
      cancelLabel: 'إلغاء',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsClearProductsPasswordOpen(true);
      },
    });
  };

  const handleOpenAddModal = () => {
    setSelectedImageFile(null);
    setSelectedImageFile2(null);
    setSelectedImageFile3(null);
    setSelectedMainCategory('');
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      image_url: '',
      image_url_2: '',
      image_url_3: '',
      is_active: true,
      has_colors: false,
      colors: [],
      category: '',
    });
    setFormErrors({});
    setCompressionInfo(null);
    setCompressionInfo2(null);
    setCompressionInfo3(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedImageFile(null);
    setSelectedImageFile2(null);
    setSelectedImageFile3(null);
    setEditingProduct(product);

    // Find parent category of this product's subcategory
    const parentGroup = hierarchy.find(g =>
      g.name === product.category ||
      (g.subcategories || []).includes(product.category || '')
    );
    setSelectedMainCategory(parentGroup ? parentGroup.name : '');

    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      image_url_2: product.image_url_2 || '',
      image_url_3: product.image_url_3 || '',
      is_active: product.is_active,
      has_colors: product.has_colors || false,
      colors: product.colors || [],
      category: product.category || '',
    });
    setFormErrors({});
    setCompressionInfo(null);
    setCompressionInfo2(null);
    setCompressionInfo3(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (formErrors[name as keyof ProductFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    if (name === 'has_colors' && !checked && formErrors.colors) {
      setFormErrors((prev) => ({ ...prev, colors: undefined }));
    }
  };

  const handleCloseModal = () => {
    setSelectedImageFile(null);
    setSelectedImageFile2(null);
    setSelectedImageFile3(null);
    setCompressionInfo(null);
    setCompressionInfo2(null);
    setCompressionInfo3(null);
    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, slot: 0 | 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fieldKey = slot === 0 ? 'image_url' : slot === 1 ? 'image_url_2' : 'image_url_3';
    const setCompressing = slot === 0 ? setIsCompressing : slot === 1 ? setIsCompressing2 : setIsCompressing3;
    const setInfo = slot === 0 ? setCompressionInfo : slot === 1 ? setCompressionInfo2 : setCompressionInfo3;
    const setFile = slot === 0 ? setSelectedImageFile : slot === 1 ? setSelectedImageFile2 : setSelectedImageFile3;

    setFormErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
    setInfo(null);
    setCompressing(true);

    try {
      const { dataUrl, info } = await processAndCompressImage(file);
      setInfo(info);
      setFile(file);
      setFormData((prev) => ({
        ...prev,
        [fieldKey]: dataUrl,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'فشل معالجة الصورة. يرجى محاولة رفع ملف آخر.';
      setFormErrors((prev) => ({
        ...prev,
        [fieldKey]: errorMsg,
      }));
      e.target.value = '';
    } finally {
      setCompressing(false);
    }
  };

  const uploadImageFiles = async (uploadedUrls: string[]) => {
    let finalImageUrl = formData.image_url;
    let finalImageUrl2 = formData.image_url_2;
    let finalImageUrl3 = formData.image_url_3;

    if (selectedImageFile) {
      const { imageUrl } = await uploadProductImage(selectedImageFile);
      finalImageUrl = imageUrl;
      uploadedUrls.push(imageUrl);
    }
    if (selectedImageFile2) {
      const { imageUrl } = await uploadProductImage(selectedImageFile2);
      finalImageUrl2 = imageUrl;
      uploadedUrls.push(imageUrl);
    }
    if (selectedImageFile3) {
      const { imageUrl } = await uploadProductImage(selectedImageFile3);
      finalImageUrl3 = imageUrl;
      uploadedUrls.push(imageUrl);
    }

    return { finalImageUrl, finalImageUrl2, finalImageUrl3 };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationData = {
      ...formData,
      price: formData.price === '' ? undefined : Number(formData.price),
      stock: formData.stock === '' ? undefined : Number(formData.stock),
    };
    const result = productFormSchema.safeParse(validationData);

    if (!result.success) {
      const errors: Partial<Record<keyof ProductFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ProductFormData;
        errors[path] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    if (editingProduct) {
      setConfirmModal({
        isOpen: true,
        title: 'حفظ تغييرات المنتج',
        message: `هل أنت متأكد من رغبتك في حفظ التغييرات على المنتج "${editingProduct.name}"؟`,
        confirmLabel: 'حفظ التغييرات',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setIsSaving(true);
          const uploadedUrls: string[] = [];
          try {
            const { finalImageUrl, finalImageUrl2, finalImageUrl3 } = await uploadImageFiles(uploadedUrls);

            await updateProduct({
              ...editingProduct,
              ...result.data,
              has_colors: result.data.has_colors ?? false,
              colors: result.data.colors ?? [],
              image_url: finalImageUrl,
              image_url_2: finalImageUrl2 || null,
              image_url_3: finalImageUrl3 || null,
              category: result.data.category ? result.data.category.trim() : null,
            });
            showToast(`تم تحديث المنتج "${result.data.name}" بنجاح!`);
            setEditingProduct(null);
          } catch (err: unknown) {
            for (const url of uploadedUrls) {
              await deleteProductImage(url).catch(() => {});
            }
            const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج';
            showToast(msg);
          } finally {
            setIsSaving(false);
            setSelectedImageFile(null);
            setSelectedImageFile2(null);
            setSelectedImageFile3(null);
          }
        },
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'إضافة منتج',
        message: `هل أنت متأكد من رغبتك في إضافة المنتج الجديد "${result.data.name}"؟`,
        confirmLabel: 'إضافة منتج',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setIsSaving(true);
          const uploadedUrls: string[] = [];
          try {
            const { finalImageUrl, finalImageUrl2, finalImageUrl3 } = await uploadImageFiles(uploadedUrls);

            await addProduct({
              ...result.data,
              has_colors: result.data.has_colors ?? false,
              colors: result.data.colors ?? [],
              image_url: finalImageUrl,
              image_url_2: finalImageUrl2 || null,
              image_url_3: finalImageUrl3 || null,
              category: result.data.category ? result.data.category.trim() : null,
            });
            showToast(`تم إضافة المنتج "${result.data.name}" بنجاح!`);
            setIsAddModalOpen(false);
          } catch (err: unknown) {
            for (const url of uploadedUrls) {
              await deleteProductImage(url).catch(() => {});
            }
            const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج';
            showToast(msg);
          } finally {
            setIsSaving(false);
            setSelectedImageFile(null);
            setSelectedImageFile2(null);
            setSelectedImageFile3(null);
          }
        },
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    const productName = deletingProduct.name;
    const productId = deletingProduct.id;
    setDeletingProduct(null);
    try {
      await deleteProduct(productId);
      showToast(`تم حذف المنتج "${productName}" بنجاح!`);
    } catch {
      showToast('فشل حذف المنتج. الرجاء المحاولة مرة أخرى.');
    }
  };

  const handleToggleActive = (product: Product) => {
    const actionName = product.is_active ? 'تعطيل' : 'تنشيط';
    setConfirmModal({
      isOpen: true,
      title: `${product.is_active ? 'تعطيل' : 'تنشيط'} المنتج`,
      message: `هل أنت متأكد من رغبتك في ${actionName} المنتج "${product.name}"؟`,
      confirmLabel: product.is_active ? 'تعطيل' : 'تنشيط',
      cancelLabel: 'إلغاء',
      isDestructive: product.is_active,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await updateProduct({
            ...product,
            is_active: !product.is_active,
          });
          showToast(`المنتج "${product.name}" أصبح الآن ${!product.is_active ? 'نشطاً' : 'غير نشط'}!`);
        } catch {
          showToast(`فشل ${product.is_active ? 'تعطيل' : 'تنشيط'} المنتج. الرجاء المحاولة مرة أخرى.`);
        }
      },
    });
  };

  return (
    <div className="space-y-8 font-tajawal text-on-surface" dir="rtl">
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          duration={3000}
        />
      )}

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

      <div className="flex flex-col lg:flex-row lg:flex-wrap justify-between items-start lg:items-center gap-4 w-full">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            إدارة المخزون
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 max-w-xl">
            قم بإنشاء وتعديل وتغيير ظهور وتحديث مخزون المنتجات في كتالوج المتجر الإلكتروني.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-5 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit uppercase tracking-wider font-bold"
            title="تصدير جميع عناصر المخزون إلى CSV"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            تصدير CSV
          </button>
          <button
            onClick={handleClearAllProducts}
            className="flex items-center gap-1.5 px-5 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-semibold text-xs cursor-pointer select-none h-fit w-fit uppercase tracking-wider font-bold"
            title="حذف جميع المنتجات في الكتالوج"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            مسح المخزون
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-primary text-on-primary px-5 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            إضافة منتج جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">إجمالي المنتجات</span>
            <span className="material-symbols-outlined text-on-surface-variant bg-surface-container-low p-2 rounded-lg text-[20px]">inventory_2</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight mt-1">
            {metrics.total}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">جميع المنتجات بالكتالوج</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">الكتالوج النشط</span>
            <span className="material-symbols-outlined text-green-600 bg-green-50 p-2 rounded-lg text-[20px]">visibility</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight mt-1">
            {metrics.active}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">المنتجات المعروضة للمشترين</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">نفد من المخزون</span>
            <span className="material-symbols-outlined text-primary bg-red-50 p-2 rounded-lg text-[20px]">warning</span>
          </div>
          <h2 className={`text-[28px] font-extrabold tracking-tight mt-1 ${metrics.outOfStock > 0 ? 'text-primary' : 'text-on-surface'}`}>
            {metrics.outOfStock}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">منتجات تحتاج لإعادة التعبئة</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">إجمالي وحدات المخزون</span>
            <span className="material-symbols-outlined text-secondary bg-yellow-50 p-2 rounded-lg text-[20px]">widgets</span>
          </div>
          <h2 className="text-[28px] font-extrabold text-on-surface tracking-tight mt-1">
            {metrics.totalStock}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">عدد قطع المخزون المتاحة</p>
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-start space-y-5">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-3">
          <span className="material-symbols-outlined text-primary text-[24px]">search</span>
          <h4 className="font-bold text-sm text-on-surface">البحث والتصفية في الكتالوج</h4>
        </div>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full">
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pr-10 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
              placeholder="ابحث عن المنتجات بالاسم أو المعرف أو الوصف..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onChange={(val) => {
                setSelectedMainCategoryFilter(val);
                setSelectedSubCategoryFilter('all');
              }}
            />

            <CustomDropdown
              labelPrefix="الفئة الفرعية:"
              options={[
                { value: 'all', label: 'جميع الفئات الفرعية' },
                ...(hierarchy.find(g => g.name === selectedMainCategoryFilter)?.subcategories || []).map(sub => ({ value: sub, label: sub }))
              ]}
              value={selectedSubCategoryFilter}
              onChange={(val) => setSelectedSubCategoryFilter(val)}
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
              onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
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
              onChange={(val) => setStockFilter(val as 'all' | 'out' | 'low' | 'instock')}
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="hidden lg:table w-full text-start border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold text-xs uppercase tracking-wider text-start">
                <th className="py-4 px-6 text-start">الصورة</th>
                <th className="py-4 px-6 text-start">تفاصيل المنتج</th>
                <th className="py-4 px-6 text-start">الفئة</th>
                <th className="py-4 px-6 text-end">السعر</th>
                <th className="py-4 px-6 text-center">المخزون</th>
                <th className="py-4 px-6 text-center">الظهور</th>
                <th className="py-4 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm">
              {filteredProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6 text-start">
                      <div className="relative w-16 h-16 rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-low">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover pointer-events-none select-none"
                          sizes="64px"
                          quality={75}
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-6 max-w-xs md:max-w-md text-start">
                      <p className="font-bold text-on-surface text-base">{product.name}</p>
                      <p className="text-xs text-on-surface-variant mt-1.5 truncate">
                        {product.description}
                      </p>
                    </td>

                    <td className="py-4 px-6 text-start">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                        {product.category}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-end font-bold text-primary text-base font-mono">
                      {formatCurrency(product.price)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.stock === 0
                            ? 'bg-red-50 text-primary border border-red-100'
                            : product.stock <= 5
                            ? 'bg-yellow-50 text-secondary border border-yellow-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {product.stock === 0 ? 'نفد من المخزون' : `${product.stock} وحدة`}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                          product.is_active
                            ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {product.is_active ? 'visibility' : 'visibility_off'}
                        </span>
                        {product.is_active ? 'نشط' : 'غير نشط'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-secondary hover:border-secondary transition-all cursor-pointer bg-white"
                          title="تعديل المنتج"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer bg-white"
                          title="حذف المنتج"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-4xl block mb-2 select-none">inventory</span>
                    لم يتم العثور على منتجات مطابقة للتصفية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (shown on mobile, hidden on desktop) */}
        <div className="block lg:hidden divide-y divide-outline-variant/10">
          {filteredProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <div key={product.id} className="p-4 space-y-4 hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-lg border border-outline-variant/20 overflow-hidden bg-surface-container-low shrink-0">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover pointer-events-none select-none"
                      sizes="80px"
                      quality={75}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-grow space-y-1 text-start">
                    <h4 className="font-bold text-on-surface text-base leading-snug">{product.name}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                        {product.category || 'عام'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        product.stock === 0
                          ? 'bg-red-50 text-primary border border-red-100'
                          : product.stock <= 5
                          ? 'bg-yellow-50 text-secondary border border-yellow-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {product.stock === 0 ? 'نفد من المخزون' : `${product.stock} وحدة`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-surface-container-low/40 p-2.5 rounded-lg">
                  {/* Price */}
                  <div className="text-start">
                    <span className="text-[10px] text-on-surface-variant block">السعر</span>
                    <span className="font-bold text-primary text-base font-mono">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${
                        product.is_active
                          ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                          : 'bg-white text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {product.is_active ? 'visibility' : 'visibility_off'}
                      </span>
                      {product.is_active ? 'نشط' : 'غير نشط'}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-secondary hover:border-secondary transition-all cursor-pointer bg-white"
                      title="تعديل المنتج"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="w-9 h-9 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer bg-white"
                      title="حذف المنتج"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-on-surface-variant font-medium text-sm">
              لم يتم العثور على أي منتجات مطابقة لخيارات التصفية.
            </div>
          )}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="bg-white border border-outline-variant/20 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.25s_ease-out] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-on-background text-white p-6 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md font-bold">
                {editingProduct ? 'تعديل تفاصيل المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-white/70 hover:text-white transition-colors cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-8 space-y-6 text-start overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="font-label-md text-on-surface block font-bold">اسم المنتج</label>
                  <input
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                      formErrors.name ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
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

                <div className="space-y-1">
                  <label className="font-label-md text-on-surface block font-bold">صورة المنتج الرئيسية</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 0)}
                      disabled={isCompressing}
                      className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container-low file:text-primary hover:file:bg-surface-container-high cursor-pointer disabled:opacity-60"
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
                  <label className="font-label-md text-on-surface block font-bold">صورة إضافية 1 (اختياري)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 1)}
                      disabled={isCompressing2}
                      className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container-low file:text-primary hover:file:bg-surface-container-high cursor-pointer disabled:opacity-60"
                    />
                    {isCompressing2 && (
                      <span className="text-xs text-primary font-medium flex items-center gap-1 shrink-0 animate-pulse">
                        <span className="material-symbols-outlined text-base select-none">architecture</span>
                        جاري معالجة الصورة...
                      </span>
                    )}
                    {!isCompressing2 && formData.image_url_2 && (
                      <div className="relative w-12 h-12 rounded border border-outline-variant/30 overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element -- data-URI preview */}
                        <img
                          src={formData.image_url_2}
                          alt="Preview 2"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
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
                  <label className="font-label-md text-on-surface block font-bold">صورة إضافية 2 (اختياري)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 2)}
                      disabled={isCompressing3}
                      className="block w-full text-xs text-on-surface-variant file:me-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container-low file:text-primary hover:file:bg-surface-container-high cursor-pointer disabled:opacity-60"
                    />
                    {isCompressing3 && (
                      <span className="text-xs text-primary font-medium flex items-center gap-1 shrink-0 animate-pulse">
                        <span className="material-symbols-outlined text-base select-none">architecture</span>
                        جاري معالجة الصورة...
                      </span>
                    )}
                    {!isCompressing3 && formData.image_url_3 && (
                      <div className="relative w-12 h-12 rounded border border-outline-variant/30 overflow-hidden bg-surface-container-low shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element -- data-URI preview */}
                        <img
                          src={formData.image_url_3}
                          alt="Preview 3"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
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
                  <label className="font-label-md text-on-surface block font-bold">السعر (ج.م)</label>
                  <input
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                      formErrors.price ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
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

                <div className="space-y-1">
                  <label className="font-label-md text-on-surface block font-bold">الكمية المتوفرة</label>
                  <input
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md ${
                      formErrors.stock ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
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

                <div className="space-y-1 text-start">
                  <label className="font-label-md text-on-surface block font-bold">القسم الرئيسي</label>
                  <CustomDropdown
                    options={[
                      { value: '', label: 'اختر القسم الرئيسي' },
                      ...hierarchy.map(g => ({ value: g.name, label: g.name }))
                    ]}
                    value={selectedMainCategory}
                    onChange={(val) => {
                      setSelectedMainCategory(val);
                      setFormData(prev => ({ ...prev, category: val }));
                      if (formErrors.category) {
                        setFormErrors(prev => ({ ...prev, category: undefined }));
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1 text-start">
                  <label className="font-label-md text-on-surface block font-bold">الفئة الفرعية</label>
                  <CustomDropdown
                    options={[
                      { value: '', label: 'اختر الفئة الفرعية' },
                      ...((hierarchy.find(g => g.name === selectedMainCategory)?.subcategories || []).map((sub: string) => ({ value: sub, label: sub })))
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

              <div className="space-y-1">
                <label className="font-label-md text-on-surface block font-bold">الوصف</label>
                <textarea
                  className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-white text-on-background font-body-md h-24 ${
                    formErrors.description ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'
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

              <div className="flex items-center gap-6 bg-surface-container-low p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    id="modal-is-active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
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
                    onChange={handleCheckboxChange}
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
                            setFormData((prev) => ({
                              ...prev,
                              colors: isSelected
                                ? (prev.colors ?? []).filter((c) => c !== color.name)
                                : [...(prev.colors ?? []), color.name],
                            }));
                            if (formErrors.colors) {
                              setFormErrors((prev) => ({ ...prev, colors: undefined }));
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
                  onClick={handleCloseModal}
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
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-outline-variant/20 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-[modalAppear_0.2s_ease-out]">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-primary mx-auto">
                <span className="material-symbols-outlined text-3xl select-none">warning</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">حذف المنتج؟</h3>
                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف **&quot;{deletingProduct.name}&quot;**؟ سيؤدي هذا الإجراء إلى إزالة المنتج نهائياً من الكتالوج ولا يمكن التراجع عنه.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-low p-4 flex gap-3 justify-end">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-sm hover:bg-white transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-bold uppercase tracking-wider"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel || 'إلغاء'}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <PasswordConfirmModal
        isOpen={isClearProductsPasswordOpen}
        title="تأكيد كلمة المرور"
        message="يرجى إدخال كلمة مرور المسؤول لتأكيد حذف جميع المنتجات من المخزون. هذا الإجراء لا يمكن التراجع عنه."
        confirmLabel="تأكيد وحذف الكل"
        onConfirm={async (password) => {
          try {
            await clearAllProducts(password);
            showToast('تم حذف جميع عناصر المخزون.');
          } catch {
            showToast('فشل حذف جميع المنتجات. الرجاء المحاولة مرة أخرى.');
          }
          setIsClearProductsPasswordOpen(false);
        }}
        onCancel={() => setIsClearProductsPasswordOpen(false)}
      />
    </div>
  );
});
