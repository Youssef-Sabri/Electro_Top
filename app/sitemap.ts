import type { MetadataRoute } from 'next';
import { SITE_METADATA } from '@/lib/constants';
import { fetchAllProductSlugs } from '@/lib/services/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_METADATA.url;

  let productEntries: { slug: string; updated_at: string }[] = [];
  try {
    productEntries = await fetchAllProductSlugs();
  } catch {
    // If product fetch fails, return static pages only
  }

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  const productPages = productEntries.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages];
}
