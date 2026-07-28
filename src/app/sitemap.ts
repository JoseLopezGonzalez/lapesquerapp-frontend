import type { MetadataRoute } from 'next';
import { metadataBaseUrl } from '@/configs/branding';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { getAllBlogSlugs } from '@/lib/blog/blogRepository';

const PUBLIC_PAGES = [
  { href: '/' as const, changeFrequency: 'weekly' as const, priority: 1 },
  { href: '/pricing' as const, changeFrequency: 'monthly' as const, priority: 0.7 },
  { href: '/legal/privacy' as const, changeFrequency: 'yearly' as const, priority: 0.3 },
  { href: '/legal/terms' as const, changeFrequency: 'yearly' as const, priority: 0.3 },
  { href: '/blog' as const, changeFrequency: 'weekly' as const, priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = metadataBaseUrl.replace(/\/$/, '');
  const now = new Date();

  const blogArticleEntries = getAllBlogSlugs().map((slug) => ({
    href: `/blog/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...PUBLIC_PAGES, ...blogArticleEntries].map(({ href, changeFrequency, priority }) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${base}${getPathname({ locale, href })}`])
    );

    return {
      url: `${base}${getPathname({ locale: routing.defaultLocale, href })}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages },
    };
  });
}
