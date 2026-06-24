export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

export type ImageMimeType = (typeof SUPPORTED_IMAGE_TYPES)[number];

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

export function isAllowedImageType(mime: string): mime is ImageMimeType {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mime);
}
