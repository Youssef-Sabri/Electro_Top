import { supabase } from '@/lib/supabase/client';
import { isAllowedImageType, readFileAsDataURL, deleteStorageFile } from '@/lib/utils/file';
import { STORAGE_BUCKETS, MAX_FILE_SIZE_MB } from '@/lib/constants';

interface ImageProcessResult {
  dataUrl: string;
  info: string;
  compressedFile: File;
}

async function compressFile(file: File): Promise<{ compressedFile: File; info: string }> {
  if (!isAllowedImageType(file.type)) {
    throw new Error('يُقبل فقط ملفات الصور (JPG, PNG, WEBP, GIF, HEIC).');
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(`حجم الملف كبير جداً (${fileSizeMB.toFixed(1)} ميجابايت). الحد الأقصى ${MAX_FILE_SIZE_MB} ميجابايت.`);
  }

  const originalKB = (file.size / 1024).toFixed(0);

  try {
    const img = await createImageBitmap(file);
    let width = img.width;
    let height = img.height;
    const maxDim = 1920;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round(height * maxDim / width);
        width = maxDim;
      } else {
        width = Math.round(width * maxDim / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2D context');
    // Fill transparent area with white to avoid black background on PNG conversion
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    img.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    );

    if (!blob) throw new Error('Canvas toBlob failed');

    const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    const compressedKB = (compressedFile.size / 1024).toFixed(0);
    return { compressedFile, info: `Compressed: ${originalKB} KB → ${compressedKB} KB` };
  } catch {
    return { compressedFile: file, info: `Compression skipped, using original (${originalKB} KB)` };
  }
}

export async function processAndCompressImage(file: File): Promise<ImageProcessResult> {
  const { compressedFile, info } = await compressFile(file);
  const dataUrl = await readFileAsDataURL(compressedFile);
  return { dataUrl, info, compressedFile };
}

export async function uploadProductImage(file: File): Promise<{ imageUrl: string; info: string }> {
  const { compressedFile, info } = await compressFile(file);

  const formData = new FormData();
  formData.append('file', compressedFile);

  const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'فشل رفع الصورة إلى التخزين.');
  }

  if (!data.imageUrl) {
    throw new Error('فشل استرداد رابط الصورة بعد الرفع.');
  }

  return { imageUrl: data.imageUrl, info };
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  await deleteStorageFile(supabase, STORAGE_BUCKETS.productImages, imageUrl);
}
