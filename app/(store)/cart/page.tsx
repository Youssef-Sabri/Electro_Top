import { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartClient';

export const metadata: Metadata = {
  title: 'عربة التسوق الخاصة بك | إلكترو توب',
  description: 'راجع العناصر الموجودة في عربة التسوق قبل إتمام الشراء.',
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-white py-6">
      <CartClient />
    </main>
  );
}
