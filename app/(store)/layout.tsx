import { ReactNode, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartReconciler } from '@/components/layout/CartReconciler';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">
        تخطى إلى المحتوى
      </a>
      <Suspense fallback={<div className="h-16 w-full bg-surface" />}>
        <Navbar />
      </Suspense>
      <main id="main-content" className="flex-grow min-h-[70vh]" tabIndex={-1}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
      <CartReconciler />
    </div>
  );
}
