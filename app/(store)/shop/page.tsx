import { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopPageContent } from '@/components/catalog/ShopPageContent';
import { Spinner } from '@/components/ui/Spinner';
import { fetchCatalog } from '@/lib/fetch-catalog';

export const metadata: Metadata = {
  title: 'Ø§Ù„Ù…ØªØ¬Ø± ÙˆØ§Ù„Ù…Ù†ØªØ¬Ø§Øª | Ø¥Ù„ÙƒØªØ±Ùˆ ØªÙˆØ¨',
  description: 'ØªØµÙØ­ ØªØ´ÙƒÙŠÙ„ØªÙ†Ø§ Ø§Ù„ÙˆØ§Ø³Ø¹Ø© Ù…Ù† Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø¬ÙˆØ¯Ø©.',
};

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
          <p className="text-gray-500 text-sm">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ ÙƒØªØ§Ù„ÙˆØ¬ Ø¥Ù„ÙƒØªØ±Ùˆ ØªÙˆØ¨...</p>
        </div>
      </div>
    }>
      <ShopCatalogLoader />
    </Suspense>
  );
}
