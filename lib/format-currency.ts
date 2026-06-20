const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'EGP';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
}
