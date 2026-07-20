import { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopPageContent } from '@/components/catalog/ShopPageContent';
import { fetchCatalog } from '@/lib/services/catalog';
import { SITE_METADATA } from '@/lib/constants';
import StoreLoading from '@/app/(store)/loading';

export const metadata: Metadata = {
  title: 'المتجر والمنتجات | إلكترو توب',
  description: 'تصفح تشكيلتنا الواسعة من المنتجات الكهربائية عالية الجودة من السويدي، ميتسوبيشي، هيمل، ABB، وفينوس.',
  alternates: {
    canonical: '/shop',
  },
};

export const revalidate = 60;

async function ShopCatalogLoader() {
  const { categories, products, hierarchy } = await fetchCatalog();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'المتجر | إلكترو توب',
            description: 'أسلاك، كابلات، لوحات توزيع، قواطع حماية، ومجري أسلاك تركية من السويدي، ميتسوبيشي، هيمل، ABB، وفينوس.',
            url: SITE_METADATA.url ? `${SITE_METADATA.url}/shop` : undefined,
            isPartOf: {
              '@type': 'WebSite',
              name: 'إلكترو توب',
              url: SITE_METADATA.url,
            },
            hasPart: products.slice(0, 20).map((p) => ({
              '@type': 'Product',
              name: p.name,
              description: p.description,
              image: p.image_url,
              offers: {
                '@type': 'Offer',
                price: p.price,
                priceCurrency: 'EGP',
                availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              },
            })),
          }).replace(/</g, '\\u003c'),
        }}
      />
      <ShopPageContent initialProducts={products} initialCategories={categories} initialHierarchy={hierarchy} />
    </>
  );
}
export default function ShopPage() {
  return (
    <Suspense fallback={<StoreLoading />}>
      <ShopCatalogLoader />
    </Suspense>
  );
}
