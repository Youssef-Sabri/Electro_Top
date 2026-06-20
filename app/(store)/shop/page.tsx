import { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopPageContent } from '../../../components/catalog/ShopPageContent';
import { Spinner } from '../../../components/ui/Spinner';
import { fetchCatalog } from '../../../lib/fetch-catalog';

export const metadata: Metadata = {
  title: 'المتجر والمنتجات | إلكترو توب',
  description: 'تصفح تشكيلتنا الواسعة من المنتجات الكهربائية عالية الجودة.',
};

// Cache page on Next.js CDN edge for 60 seconds (Incremental Static Regeneration - ISR)
export const revalidate = 60;

async function ShopCatalogLoader() {
  const { categories, products } = await fetchCatalog();

  return (
    <ShopPageContent initialProducts={products} initialCategories={categories} />
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-poppins bg-white">
        <div className="flex flex-col items-center">
          <Spinner className="h-10 w-10 mb-4" />
          <p className="text-gray-500 text-sm">جاري تحميل كتالوج إلكترو توب...</p>
        </div>
      </div>
    }>
      <ShopCatalogLoader />
    </Suspense>
  );
}
