import { Metadata } from 'next';
import { LandingPage } from '@/components/catalog/LandingPage';
import { fetchCatalog, fetchActiveSubcategoryBanners } from '@/lib/services/catalog';

import { SITE_METADATA } from '@/lib/constants';

export const metadata: Metadata = {
  title: SITE_METADATA.title,
  description: SITE_METADATA.description,
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 60;

export default async function Page() {
  const [{ categories, products, hierarchy }, banners] = await Promise.all([
    fetchCatalog(),
    fetchActiveSubcategoryBanners(),
  ]);

  return (
    <main className="min-h-screen">
      <LandingPage
        initialCategories={categories}
        initialProducts={products}
        initialHierarchy={hierarchy}
        initialBanners={banners}
      />
    </main>
  );
}
