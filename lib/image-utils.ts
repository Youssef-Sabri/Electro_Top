import { supabase } from './supabase';

interface ImageProcessResult {
  dataUrl: string;
  info: string;
  compressedFile: File;
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function getAllowedExtension(mimeType: string): string {
  return ALLOWED_IMAGE_TYPES[mimeType] || 'webp';
}

const MAX_FILE_SIZE_MB = 5;

async function compressFile(file: File): Promise<{ compressedFile: File; info: string }> {
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
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
    const ctx = canvas.getContext('2d')!;
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

  return new Promise<ImageProcessResult>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve({ dataUrl: reader.result, info, compressedFile });
      } else {
        reject(new Error('فشل تحويل الصورة المضغوطة إلى رابط.'));
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الصورة المضغوطة.'));
    reader.readAsDataURL(compressedFile);
  });
}

export async function uploadProductImage(file: File): Promise<{ imageUrl: string; info: string }> {
  const { compressedFile, info } = await compressFile(file);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  if (compressedFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.');
  }

  const ext = getAllowedExtension(compressedFile.type);
  const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  const fileName = `product-${randomPart}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, compressedFile, { 
      contentType: compressedFile.type, 
      upsert: false,
      // Note: fileSizeLimit is backend-enforced on bucket settings in Supabase dashboard
    });

  if (uploadError) {
    if (process.env.NODE_ENV !== 'production') console.error('Product image upload failed:', uploadError.message);
    throw new Error('فشل رفع الصورة إلى التخزين.');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  if (!publicUrl) {
    throw new Error('فشل استرداد رابط الصورة بعد الرفع.');
  }

  return { imageUrl: publicUrl, info };
}

function extractFileName(imageUrl: string): string {
  const urlParts = imageUrl.split('/');
  const rawFileName = urlParts[urlParts.length - 1] || '';
  return decodeURIComponent(rawFileName.split('?')[0]);
}

async function deleteStorageImage(bucket: string, _marker: string, imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  // Accept both full URLs and bare filenames
  const fileName = imageUrl.includes('/') ? extractFileName(imageUrl) : imageUrl;
  if (!fileName) return;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error(`Failed to delete file from '${bucket}':`, error.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(`Error deleting file from '${bucket}':`, err);
  }
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  await deleteStorageImage('product-images', '/product-images/', imageUrl);
}

const STORAGE_LIST_LIMIT = 100;

async function clearBucket(bucketName: string): Promise<void> {
  try {
    let allFiles: { name: string }[] = [];
    let offset = 0;

    while (true) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(undefined, { limit: STORAGE_LIST_LIMIT, offset });

      if (listError) {
        if (process.env.NODE_ENV !== 'production') console.error(`Failed to list files in '${bucketName}':`, listError.message);
        return;
      }

      if (!files || files.length === 0) break;
      allFiles = allFiles.concat(files);
      if (files.length < STORAGE_LIST_LIMIT) break;
      offset += STORAGE_LIST_LIMIT;
    }

    if (allFiles.length > 0) {
      const fileNames = allFiles.map((file) => file.name);
      const { error: removeError } = await supabase.storage.from(bucketName).remove(fileNames);
      if (removeError) {
        if (process.env.NODE_ENV !== 'production') console.error(`Failed to delete files from '${bucketName}':`, removeError.message);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(`Error clearing bucket '${bucketName}':`, err);
  }
}

export async function clearAllReceipts(): Promise<void> {
  await clearBucket('instapay-receipts');
}

export async function clearAllProductImages(): Promise<void> {
  await clearBucket('product-images');
}

export async function deleteReceiptImage(imageUrl: string): Promise<void> {
  await deleteStorageImage('instapay-receipts', '/instapay-receipts/', imageUrl);
}
