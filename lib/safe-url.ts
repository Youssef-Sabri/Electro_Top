export function isSafeUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSafeUrl(url: string | null | undefined): string | null {
  return isSafeUrl(url) ? url : null;
}
