import { z } from 'zod';
import { isSafeUrl } from '@/lib/safe-url';

const egyptPhoneRegex = /^01[0-9]{9}$/;

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'الاسم يجب أن يكون من حرفين على الأقل').max(100, 'الاسم يجب ألا يتجاوز 100 حرف'),
  phone_number: z.string()
    .min(11, 'الرجاء إدخال رقم هاتف صحيح (11 رقماً على الأقل)')
    .regex(egyptPhoneRegex, 'الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678)'),
  shipping_address: z.string().min(10, 'الرجاء إدخال العنوان بالتفصيل (10 أحرف على الأقل)').max(500, 'العنوان يجب ألا يتجاوز 500 حرف'),
  location_link: z.union([
    z.string().refine((val) => isSafeUrl(val), { message: 'يُقبل فقط روابط جوجل ماب الآمنة' }),
    z.literal('')
  ]).optional(),
  payment_method: z.enum(['instapay', 'cod']),
  instapay_screenshot: z.string().optional(),
  instapay_phone_number: z.string().regex(egyptPhoneRegex, 'الرجاء إدخال رقم هاتف مصري صحيح').optional().or(z.literal('')),
}).refine((data) => {
  if (data.payment_method === 'instapay' && !data.instapay_screenshot) {
    return false;
  }
  return true;
}, {
  message: 'الرجاء تحميل لقطة شاشة لإيصال تحويل إنستاباي',
  path: ['instapay_screenshot'],
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const productFormSchema = z.object({
  name: z.string().min(2, 'يجب أن يكون الاسم حرفين على الأقل'),
  description: z.string().min(10, 'يجب أن يكون الوصف 10 أحرف على الأقل').max(2000, 'الوصف يجب ألا يتجاوز 2000 حرف'),
  price: z.number({ message: 'السعر مطلوب' }).min(0.01, 'يجب أن يكون السعر أكبر من 0'),
  stock: z.number({ message: 'الكمية مطلوبة' }).int().min(0, 'لا يمكن أن تكون الكمية سالبة'),
  image_url: z.string().url('الرجاء إدخال رابط صورة صحيح').min(1, 'تحميل صورة المنتج مطلوب'),
  is_active: z.boolean(),
  category: z.string().optional().nullable(),
});

export const SAFE_FILENAME_RE = /^receipt-[a-z0-9]+\.(jpg|jpeg|png|webp|heic|heif|gif)$/i;

export const categorySchema = z.string().min(1, 'اسم الفئة مطلوب').max(50, 'اسم الفئة يجب ألا يتجاوز 50 حرفاً');

export type ProductFormData = z.infer<typeof productFormSchema>;
