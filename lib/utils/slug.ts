const ARABIC_TO_LATIN: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h',
  'ى': 'a', 'ء': 'a',
  '٠': '0', '١': '1', '٢': '2', '٣': '3',
  '٤': '4', '٥': '5', '٦': '6', '٧': '7',
  '٨': '8', '٩': '9',
};

const HEAVY_MAP: Record<string, string> = {
  'ص': 'ss', 'ض': 'dd', 'ط': 'tt', 'ظ': 'zz',
};

export function slugify(text: string, id?: string): string {
  let result = '';

  for (const char of text) {
    if (HEAVY_MAP[char]) {
      result += HEAVY_MAP[char];
    } else if (ARABIC_TO_LATIN[char]) {
      result += ARABIC_TO_LATIN[char];
    } else if (/[a-zA-Z0-9\u0600-\u06FF]/.test(char)) {
      result += char;
    } else if (char === ' ' || char === '-' || char === '_') {
      result += '-';
    }
  }

  result = result
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!result) {
    result = 'product';
  }

  if (id) {
    const cleanId = id.replace(/^p-/, '').toLowerCase();
    result = `${result}-${cleanId}`;
  }

  return result;
}
