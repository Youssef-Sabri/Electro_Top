import { Metadata } from 'next';
import { LandingPage } from '@/components/catalog/LandingPage';
import { fetchCatalog } from '@/lib/fetch-catalog';

export const metadata: Metadata = {
  title: 'Ø¥Ù„ÙƒØªØ±Ùˆ ØªÙˆØ¨ | Ù…Ø³ØªÙ„Ø²Ù…Ø§Øª ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© Ù…Ø¹ØªÙ…Ø¯Ø©',
  description: 'Ù…ØªØ¬Ø± Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…ØªØ®ØµØµ ÙÙŠ Ø§Ù„Ù…Ø³ØªÙ„Ø²Ù…Ø§Øª Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ©. ØªØ³ÙˆÙ‚ ÙƒØ²Ø§Ø¦Ø± ÙˆØªØªØ¨Ø¹ Ø·Ù„Ø¨Ùƒ Ø¨Ø³Ù‡ÙˆÙ„Ø©.',
};

export const revalidate = 60;

export default async function Page() {
  const { categories, products } = await fetchCatalog();

  return (
    <main className="min-h-screen">
      <LandingPage initialCategories={categories} initialProducts={products} />
    </main>
  );
}
