import type { Product } from '@/types';

export function defaultProductSort(a: Product, b: Product): number {
  return (
    (a.category || '').localeCompare(b.category || '', 'ar') ||
    (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
    a.name.localeCompare(b.name, 'ar', { numeric: true, sensitivity: 'base' })
  );
}
