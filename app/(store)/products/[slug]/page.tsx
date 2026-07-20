import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { fetchProductBySlug } from '@/lib/services/catalog';
import { SITE_METADATA } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils/format';
import { ProductDetailActions } from '@/components/catalog/ProductDetailActions';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import StoreLoading from '@/app/(store)/loading';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: 'المنتج غير موجود | إلكترو توب',
      robots: { index: false },
    };
  }

  const description = product.description?.slice(0, 155) || product.name;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      url: SITE_METADATA.url ? `${SITE_METADATA.url}/products/${slug}` : undefined,
      siteName: 'إلكترو توب',
      locale: 'ar_EG',
      type: 'website',
      images: product.image_url
        ? [
            {
              url: product.image_url,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <Suspense fallback={<StoreLoading />}>
      <ProductContent product={product} slug={slug} />
    </Suspense>
  );
}

async function ProductContent({ product, slug }: { product: NonNullable<Awaited<ReturnType<typeof fetchProductBySlug>>>; slug: string }) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get('x-nonce') || undefined;
  const baseUrl = SITE_METADATA.url || '';

  const images = [product.image_url, product.image_url_2, product.image_url_3]
    .filter((img): img is string => !!img)
    .map((img) => (img.startsWith('http') ? img : `${baseUrl}${img}`));

  const productUrl = `${baseUrl}/products/${slug}`;

  return (
    <div className="min-h-screen bg-white font-tajawal text-on-surface">
      {/* Breadcrumb */}
      <div className="bg-neutral-50/80 border-b border-neutral-200/50 backdrop-blur-sm">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-1.5 sm:py-2">
          <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-500 whitespace-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/" className="hover:text-primary transition-colors shrink-0">الرئيسية</Link>
            <span className="material-symbols-outlined text-[12px] text-neutral-400 shrink-0 select-none">chevron_left</span>
            <Link href="/shop" className="hover:text-primary transition-colors shrink-0">المتجر</Link>
            <span className="material-symbols-outlined text-[12px] text-neutral-400 shrink-0 select-none">chevron_left</span>
            {product.category && (
              <>
                <Link
                  href={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-primary transition-colors shrink-0"
                >
                  {product.category}
                </Link>
                <span className="material-symbols-outlined text-[12px] text-neutral-400 shrink-0 select-none">chevron_left</span>
              </>
            )}
            <span className="text-neutral-900 font-medium truncate max-w-[150px] sm:max-w-xs shrink-0 sm:shrink">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Image Gallery */}
          <ProductImageGallery
            images={images}
            productName={product.name}
            isOutOfStock={product.stock <= 0}
          />

          {/* Product Info */}
          <div className="flex flex-col">
            {product.category && (
              <span className="inline-block bg-surface-container border border-outline-variant/50 text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-4">
                {product.category}
              </span>
            )}

            <h1 className="font-headline-lg text-lg sm:text-2xl md:text-3xl font-extrabold text-on-surface leading-snug sm:leading-tight mb-3 sm:mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="text-primary font-extrabold text-xl sm:text-2xl md:text-3xl">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">جنيه مصري</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="font-bold text-sm text-on-surface mb-3">الوصف</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Interactive Actions (colors, quantity, add to cart) */}
            <div className="mt-auto">
              <ProductDetailActions product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD Product Schema */}
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: images,
            url: productUrl,
            brand: product.category
              ? {
                  '@type': 'Brand',
                  name: product.category,
                }
              : undefined,
            offers: {
              '@type': 'Offer',
              url: productUrl,
              priceCurrency: 'EGP',
              price: product.price,
              availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
              seller: {
                '@type': 'Organization',
                name: 'إلكترو توب',
                url: SITE_METADATA.url || undefined,
              },
            },
          }).replace(/</g, '\\u003c'),
        }}
      />

      {/* Breadcrumb JSON-LD */}
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'الرئيسية',
                item: baseUrl || undefined,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'المتجر',
                item: baseUrl ? `${baseUrl}/shop` : undefined,
              },
              ...(product.category
                ? [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.category,
                      item: baseUrl ? `${baseUrl}/shop?category=${encodeURIComponent(product.category)}` : undefined,
                    },
                  ]
                : []),
              {
                '@type': 'ListItem',
                position: product.category ? 4 : 3,
                name: product.name,
                item: baseUrl ? productUrl : undefined,
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}
