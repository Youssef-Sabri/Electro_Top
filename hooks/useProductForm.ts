import { useState, useCallback } from 'react';
import type { Product, CategoryGroup } from '@/types';
import { type ProductFormData, productFormSchema } from '@/lib/validations';
import { uploadProductImage, processAndCompressImage, deleteProductImage } from '@/lib/utils/image';

type FormData = Omit<ProductFormData, 'price' | 'stock'> & { price: number | ''; stock: number | '' };

interface UseProductFormOptions {
  hierarchy: CategoryGroup[];
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (product: Product) => void;
  showSuccess: (msg: string) => void;
  openConfirm: (config: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => void;
  closeConfirm: () => void;
}

const EMPTY_FORM: FormData = {
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
};

export function useProductForm({ hierarchy, addProduct, updateProduct, showSuccess, openConfirm, closeConfirm }: UseProductFormOptions) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [formMainCategory, setFormMainCategory] = useState('');

  const [isCompressing, setIsCompressing] = useState(false);
  const [isCompressing2, setIsCompressing2] = useState(false);
  const [isCompressing3, setIsCompressing3] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [compressionInfo2, setCompressionInfo2] = useState<string | null>(null);
  const [compressionInfo3, setCompressionInfo3] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImageFile2, setSelectedImageFile2] = useState<File | null>(null);
  const [selectedImageFile3, setSelectedImageFile3] = useState<File | null>(null);

  const resetImageState = useCallback(() => {
    setSelectedImageFile(null);
    setSelectedImageFile2(null);
    setSelectedImageFile3(null);
    setCompressionInfo(null);
    setCompressionInfo2(null);
    setCompressionInfo3(null);
  }, []);

  const openAdd = useCallback(() => {
    resetImageState();
    setFormMainCategory('');
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsAddModalOpen(true);
  }, [resetImageState]);

  const openEdit = useCallback((product: Product) => {
    resetImageState();
    setEditingProduct(product);

    const parentGroup = hierarchy.find(g =>
      g.name === product.category ||
      (g.subcategories || []).includes(product.category || '')
    );
    setFormMainCategory(parentGroup ? parentGroup.name : '');

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
  }, [hierarchy, resetImageState]);

  const closeModal = useCallback(() => {
    resetImageState();
    setFormMainCategory('');
    setIsAddModalOpen(false);
    setEditingProduct(null);
  }, [resetImageState]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === 'number') {
      parsedValue = value === '' ? '' : parseFloat(value);
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (formErrors[name as keyof ProductFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }, [formErrors]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    if (name === 'has_colors' && !checked && formErrors.colors) {
      setFormErrors((prev) => ({ ...prev, colors: undefined }));
    }
  }, [formErrors]);

  const handleImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, slot: 0 | 1 | 2) => {
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
      setFormData((prev) => ({ ...prev, [fieldKey]: dataUrl }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'فشل معالجة الصورة. يرجى محاولة رفع ملف آخر.';
      setFormErrors((prev) => ({ ...prev, [fieldKey]: errorMsg }));
      e.target.value = '';
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleSetAsMainImage = useCallback((slot: 1 | 2) => {
    const fieldKey = slot === 1 ? 'image_url_2' : 'image_url_3';
    const file = slot === 1 ? selectedImageFile2 : selectedImageFile3;
    const info = slot === 1 ? compressionInfo2 : compressionInfo3;

    const additionalUrl = formData[fieldKey];
    if (!additionalUrl) return;

    setFormData((prev) => ({
      ...prev,
      [fieldKey]: prev.image_url,
      image_url: additionalUrl,
    }));

    const setMainFile = setSelectedImageFile;
    const setAdditionalFile = slot === 1 ? setSelectedImageFile2 : setSelectedImageFile3;
    const mainFile = selectedImageFile;
    setMainFile(file);
    setAdditionalFile(mainFile);

    const setMainInfo = setCompressionInfo;
    const setAdditionalInfo = slot === 1 ? setCompressionInfo2 : setCompressionInfo3;
    const mainInfo = compressionInfo;
    setMainInfo(info);
    setAdditionalInfo(mainInfo);
  }, [formData, selectedImageFile, selectedImageFile2, selectedImageFile3, compressionInfo, compressionInfo2, compressionInfo3]);

  const uploadImageFiles = useCallback(async (uploadedUrls: string[]) => {
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
  }, [formData.image_url, formData.image_url_2, formData.image_url_3, selectedImageFile, selectedImageFile2, selectedImageFile3]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
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
      openConfirm({
        title: 'حفظ تغييرات المنتج',
        message: `هل أنت متأكد من رغبتك في حفظ التغييرات على المنتج "${editingProduct.name}"؟`,
        confirmLabel: 'حفظ التغييرات',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          closeConfirm();
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
            showSuccess(`تم تحديث المنتج "${result.data.name}" بنجاح!`);
            setEditingProduct(null);
          } catch (err: unknown) {
            for (const url of uploadedUrls) {
              await deleteProductImage(url).catch(() => {});
            }
            const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج';
            showSuccess(msg);
          } finally {
            setIsSaving(false);
            resetImageState();
          }
        },
      });
    } else {
      openConfirm({
        title: 'إضافة منتج',
        message: `هل أنت متأكد من رغبتك في إضافة المنتج الجديد "${result.data.name}"؟`,
        confirmLabel: 'إضافة منتج',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          closeConfirm();
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
            showSuccess(`تم إضافة المنتج "${result.data.name}" بنجاح!`);
            setIsAddModalOpen(false);
          } catch (err: unknown) {
            for (const url of uploadedUrls) {
              await deleteProductImage(url).catch(() => {});
            }
            const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المنتج';
            showSuccess(msg);
          } finally {
            setIsSaving(false);
            resetImageState();
          }
        },
      });
    }
  }, [formData, editingProduct, addProduct, updateProduct, showSuccess, openConfirm, closeConfirm, uploadImageFiles, resetImageState]);

  return {
    isAddModalOpen,
    editingProduct,
    isSaving,
    formData,
    formErrors,
    formMainCategory,
    isCompressing,
    isCompressing2,
    isCompressing3,
    compressionInfo,
    compressionInfo2,
    compressionInfo3,
    openAdd,
    openEdit,
    closeModal,
    setFormMainCategory,
    setFormData,
    setFormErrors,
    handleInputChange,
    handleCheckboxChange,
    handleImageFileChange,
    handleSetAsMainImage,
    handleFormSubmit,
  };
}
