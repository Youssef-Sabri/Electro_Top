import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cairo, Tajawal } from 'next/font/google';
import { headers } from 'next/headers';
import { z } from 'zod';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';


const jsonLdEnvSchema = z.object({
  siteUrl: z.union([z.string().url(), z.literal('')]).default(''),
  supportPhone1: z.string().optional().default(''),
  supportPhone2: z.string().optional().default(''),
});

type JsonLdEnv = z.infer<typeof jsonLdEnvSchema>;

function getJsonLdEnv(): JsonLdEnv {
  return jsonLdEnvSchema.parse({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
    supportPhone1: process.env.NEXT_PUBLIC_SUPPORT_PHONE_1 || '',
    supportPhone2: process.env.NEXT_PUBLIC_SUPPORT_PHONE_2 || '',
  });
}


const materialSymbolsUrl = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

import { SITE_METADATA } from '@/lib/constants';

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
  openGraph: {
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    url: SITE_METADATA.url,
    siteName: 'إلكترو توب',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'إلكترو توب',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    images: ['/logo.png'],
  },
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
        {/* Lazy-load Google Material Symbols Outlined icon font (non-render-blocking) */}
        <link
          href={materialSymbolsUrl}
          rel="preload"
          as="style"
        />
        <link
          href={materialSymbolsUrl}
          rel="stylesheet"
        />
         {(() => {
            const env = getJsonLdEnv();
            return (
              <script
                nonce={nonce}
                suppressHydrationWarning
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Store',
                    name: 'إلكترو توب',
                    description: 'الموزع المعتمد لمنتجات السويدي، شنايدر، سيمنز، هيميل، جيويس، وشينت. مستلزمات كهربائية ممتازة مع إمكانية الدفع كزائر وتتبع الطلبات.',
                    url: env.siteUrl,
                    telephone: [env.supportPhone1, env.supportPhone2].filter(Boolean),
                    areaServed: 'EG',
                    hasOfferCatalog: {
                      '@type': 'OfferCatalog',
                      name: 'المستلزمات الكهربائية',
                    },
                  }).replace(/</g, '\\u003c'),
                }}
              />
            );
          })()}
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
