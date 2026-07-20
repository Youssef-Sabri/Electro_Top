import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const CheckoutForm = dynamic(() => import('@/components/checkout/CheckoutForm').then(mod => ({ default: mod.CheckoutForm })), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

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
