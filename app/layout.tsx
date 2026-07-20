import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Cairo, Tajawal } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { CartProvider } from '@/providers/CartContext';
import { ProductsProvider } from '@/providers/ProductsContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SITE_METADATA } from '@/lib/constants';

const materialSymbolsUrl = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: SITE_METADATA.url ? new URL(SITE_METADATA.url) : undefined,
  title: {
    default: SITE_METADATA.title,
    template: `%s | ${SITE_METADATA.title}`,
  },
  description: SITE_METADATA.description,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_METADATA.url || undefined,
    languages: {
      'ar': SITE_METADATA.url || undefined,
      'x-default': SITE_METADATA.url || undefined,
    },
  },
  openGraph: {
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    url: SITE_METADATA.url,
    siteName: 'إلكترو توب',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: SITE_METADATA.url ? `${SITE_METADATA.url}/og-image.png` : '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'إلكترو توب - مستلزمات كهربائية معتمدة',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    images: [SITE_METADATA.url ? `${SITE_METADATA.url}/og-image.png` : '/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get('x-nonce') || undefined;

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href={materialSymbolsUrl}
          rel="stylesheet"
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'إلكترو توب',
              description: 'موزعون معتمدون للسويدي إلكتريك، ميتسوبيشي، هيمل، ABB، وفينوس. أسلاك، كابلات، لوحات توزيع، قواطع حماية، ومجري أسلاك تركية للمشاريع السكنية والتجارية والصناعية.',
              url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
              telephone: [process.env.NEXT_PUBLIC_SUPPORT_PHONE_1, process.env.NEXT_PUBLIC_SUPPORT_PHONE_2].filter(Boolean),
              email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined,
              areaServed: 'EG',
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'المستلزمات الكهربائية',
              },
            }).replace(/</g, '\\u003c'),
          }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'إلكترو توب',
              url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/shop?search={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }).replace(/</g, '\\u003c'),
          }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SiteNavigationElement',
              name: ['الرئيسية', 'المتجر', 'تتبع الطلب', 'الدعم'],
              url: [
                `${process.env.NEXT_PUBLIC_SITE_URL || ''}/`,
                `${process.env.NEXT_PUBLIC_SITE_URL || ''}/shop`,
                `${process.env.NEXT_PUBLIC_SITE_URL || ''}/track`,
                `${process.env.NEXT_PUBLIC_SITE_URL || ''}/support`,
              ],
            }).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className="min-h-full bg-background text-on-surface font-body-md flex flex-col">
        <ErrorBoundary>
          <ProductsProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ProductsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
