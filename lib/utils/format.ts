const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'EGP';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
}

export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function calculateDiscountedPrice(price: number, discountPercentage?: number | null): {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
  discountPercentage: number;
} {
  if (!discountPercentage || discountPercentage <= 0) {
    return {
      originalPrice: price,
      discountedPrice: price,
      discountAmount: 0,
      hasDiscount: false,
      discountPercentage: 0,
    };
  }
  const pct = Math.min(99, Math.max(1, discountPercentage));
  const discountAmount = Math.round(price * (pct / 100) * 100) / 100;
  const discountedPrice = Math.max(0.01, Math.round((price - discountAmount) * 100) / 100);
  return {
    originalPrice: price,
    discountedPrice,
    discountAmount,
    hasDiscount: true,
    discountPercentage: pct,
  };
}

