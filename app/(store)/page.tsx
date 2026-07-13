import { Metadata } from 'next';
import { LandingPage } from '@/components/catalog/LandingPage';
import { fetchCatalog } from '@/lib/services/catalog';

import { SITE_METADATA } from '@/lib/constants';

export const metadata: Metadata = {
  title: SITE_METADATA.title,
  description: SITE_METADATA.description,
};

export const revalidate = 60;

export default async function Page() {
  const { categories, products, hierarchy } = await fetchCatalog();

  return (
    <main className="min-h-screen">
      <LandingPage initialCategories={categories} initialProducts={products} initialHierarchy={hierarchy} />
    </main>
  );
}
