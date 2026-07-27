import type { MetadataRoute } from 'next';
import { metadataBaseUrl } from '@/configs/branding';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = metadataBaseUrl.replace(/\/$/, '');
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
