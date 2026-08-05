import { useMemo } from 'react';
import type { Product, SubcategoryBanner } from '@/types';
import { calculateDiscountedPrice } from '@/lib/utils/format';

export function getDiscountedProduct(product: Product, discountBanner?: SubcategoryBanner | null) {
  const pct = discountBanner?.discount_percentage ?? product.discount_percentage;
  const basePrice = product.original_price ?? product.price;
  const discountInfo = calculateDiscountedPrice(basePrice, pct);

  const effectiveProduct = discountInfo.hasDiscount
    ? {
        ...product,
        price: discountInfo.discountedPrice,
        original_price: discountInfo.originalPrice,
        discount_percentage: discountInfo.discountPercentage,
      }
    : product;

  return { discountInfo, effectiveProduct };
}

export function useDiscountedProduct(product: Product, discountBanner?: SubcategoryBanner | null) {
  return useMemo(() => getDiscountedProduct(product, discountBanner), [product, discountBanner]);
}
