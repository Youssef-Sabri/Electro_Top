import { z } from 'zod';

const egyptPhoneRegex = /^01[0-9]{9}$/;

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'الاسم يجب أن يكون من حرفين على الأقل').max(100, 'الاسم يجب ألا يتجاوز 100 حرف'),
  phone_number: z.string()
    .min(11, 'الرجاء إدخال رقم هاتف صحيح (11 رقماً على الأقل)')
    .regex(egyptPhoneRegex, 'الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678)'),
  shipping_address: z.string().min(10, 'الرجاء إدخال العنوان بالتفصيل (10 أحرف على الأقل)').max(500, 'العنوان يجب ألا يتجاوز 500 حرف'),
  location_link: z.union([
    z.string().url('الرجاء إدخال رابط موقع جغرافي صحيح من جوجل ماب')
      .refine((val) => {
        try {
          const url = new URL(val);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch { return false; }
      }, { message: 'الرجاء إدخال رابط آمن (يبدأ بـ http/https)' }),
    z.literal('')
  ]).optional(),
  instapay_screenshot: z.string().min(1, 'الرجاء تحميل لقطة شاشة لإيصال تحويل إنستاباي'),
  instapay_phone_number: z.string().regex(egyptPhoneRegex, 'الرجاء إدخال رقم هاتف مصري صحيح').optional().or(z.literal('')),
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

export type ProductFormData = z.infer<typeof productFormSchema>;
