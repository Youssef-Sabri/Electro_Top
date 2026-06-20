import { Metadata } from 'next';
import { LandingPage } from '../../components/catalog/LandingPage';
import { fetchCatalog } from '../../lib/fetch-catalog';

export const metadata: Metadata = {
  title: 'إلكترو توب | مستلزمات كهربائية معتمدة',
  description: 'متجر إلكتروني متخصص في المستلزمات الكهربائية. تسوق كزائر وتتبع طلبك بسهولة.',
};

// Revalidate home page cache every 60 seconds
export const revalidate = 60;

export default async function Page() {
  const { categories, products } = await fetchCatalog();

  return (
    <main className="min-h-screen">
      <LandingPage initialCategories={categories} initialProducts={products} />
    </main>
  );
}
