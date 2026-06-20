import { ReactNode, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartReconciler } from '@/components/layout/CartReconciler';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="h-16 w-full bg-surface" />}>
        <Navbar />
      </Suspense>
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartReconciler />
    </div>
  );
}
