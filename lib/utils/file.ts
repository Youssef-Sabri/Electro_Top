import type { SupabaseClient } from '@supabase/supabase-js';
import { devLog } from '@/lib/utils/misc';

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file as data URL'));
    };
    reader.onerror = () => reject(new Error('Failed to read file as data URL'));
    reader.readAsDataURL(file);
  });
}

function extractFileName(filePath: string): string | undefined {
  const raw = filePath.split('/').pop()?.split('?')[0];
  return raw ? decodeURIComponent(raw) : undefined;
}

export async function deleteStorageFile(
  client: SupabaseClient,
  bucket: string,
  url: string
): Promise<void> {
  let fileName = url;
  const publicMarker = `/public/${bucket}/`;
  if (url.includes(publicMarker)) {
    fileName = url.substring(url.indexOf(publicMarker) + publicMarker.length).split('?')[0];
  } else if (url.includes('/')) {
    fileName = extractFileName(url) || url;
  }
  fileName = decodeURIComponent(fileName);
  if (!fileName) return;
  await client.storage.from(bucket).remove([fileName]);
}

const STORAGE_LIST_LIMIT = 100;

export async function clearStorageBucket(
  client: SupabaseClient,
  bucketName: string
): Promise<void> {
  try {
    let allFiles: { name: string }[] = [];
    let offset = 0;

    while (true) {
      const { data: files, error: listError } = await client.storage
        .from(bucketName)
        .list(undefined, { limit: STORAGE_LIST_LIMIT, offset });

      if (listError) {
        devLog(`Failed to list files in '${bucketName}':`, listError.message);
        return;
      }

      if (!files || files.length === 0) break;
      allFiles = allFiles.concat(files);
      if (files.length < STORAGE_LIST_LIMIT) break;
      offset += STORAGE_LIST_LIMIT;
    }

    if (allFiles.length > 0) {
      const fileNames = allFiles.map((file) => file.name);
      const { error: removeError } = await client.storage.from(bucketName).remove(fileNames);
      if (removeError) {
        devLog(`Failed to delete files from '${bucketName}':`, removeError.message);
      }
    }
  } catch (err) {
    devLog(`Error clearing bucket '${bucketName}':`, err);
  }
}

// Magic bytes detection and MIME validation
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

type ImageMimeType = (typeof SUPPORTED_IMAGE_TYPES)[number];

function toUint8(buffer: ArrayBuffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function hexHeader(buffer: Uint8Array, length = 12): string {
  return Array.from(buffer.slice(0, length))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function detectImageMimeType(buffer: ArrayBuffer | Uint8Array): ImageMimeType | null {
  const arr = toUint8(buffer);
  if (arr.length < 12) return null;

  const header = hexHeader(arr);

  if (header.startsWith('ff d8')) return 'image/jpeg';
  if (header.startsWith('89 50 4e 47 0d 0a 1a 0a')) return 'image/png';

  if (header.startsWith('52 49 46 46')) {
    const tag = String.fromCharCode(arr[8], arr[9], arr[10], arr[11]);
    if (tag === 'WEBP') return 'image/webp';
  }

  if (
    header.startsWith('47 49 46 38 37 61') ||
    header.startsWith('47 49 46 38 39 61')
  ) {
    return 'image/gif';
  }

  const ftyp = String.fromCharCode(arr[4], arr[5], arr[6], arr[7]);
  if (ftyp === 'ftyp') {
    const brand = String.fromCharCode(arr[8], arr[9], arr[10], arr[11]);
    if (
      brand.startsWith('heic') ||
      brand.startsWith('heix') ||
      brand.startsWith('heim') ||
      brand.startsWith('heis') ||
      brand.startsWith('mif1') ||
      brand.startsWith('msf1')
    ) {
      return 'image/heic';
    }
  }

  return null;
}

export const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heic',
};

export function isAllowedImageType(mime: string): mime is ImageMimeType {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mime);
}
