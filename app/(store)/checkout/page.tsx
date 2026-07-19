import { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = {
  title: 'الدفع كزائر | إلكترو توب',
  description: 'أكمل عملية الشراء وأكد طلبك.',
  alternates: {
    canonical: '/checkout',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white py-6">
      <CheckoutForm />
    </main>
  );
}
