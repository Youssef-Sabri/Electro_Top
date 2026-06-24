import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cairo, Tajawal } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { OrdersProvider } from '@/context/OrdersContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';


const materialSymbolsUrl = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'إلكترو توب | مستلزمات كهربائية معتمدة',
  description: 'الموزع المعتمد لمنتجات السويدي، شنايدر، سيمنز، هيميل، جيويس، وشينت. مستلزمات كهربائية ممتازة مع إمكانية الدفع كزائر وتتبع الطلبات.',
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
        <meta name="referrer" content="strict-origin-when-cross-origin" />
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
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'إلكترو توب',
              description: 'الموزع المعتمد لمنتجات السويدي، شنايدر، سيمنز، هيميل، جيويس، وشينت. مستلزمات كهربائية ممتازة مع إمكانية الدفع كزائر وتتبع الطلبات.',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://electrotop-eg.com',
              telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+20 103 344 3324',
              areaServed: 'EG',
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'المستلزمات الكهربائية',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-background text-on-surface font-body-md flex flex-col">
        <ErrorBoundary>
          <ProductsProvider>
            <OrdersProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </OrdersProvider>
          </ProductsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
