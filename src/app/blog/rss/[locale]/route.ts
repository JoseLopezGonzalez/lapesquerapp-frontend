import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { metadataBaseUrl, appName } from '@/configs/branding';
import { getArticleSummaries } from '@/lib/blog/blogRepository';
import type { BlogLocale } from '@/types/blog';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const base = metadataBaseUrl.replace(/\/$/, '');
  const channelLink = `${base}${getPathname({ locale, href: '/blog' })}`;
  const articles = getArticleSummaries(locale as BlogLocale);

  const items = articles
    .map((article) => {
      const link = `${base}${getPathname({ locale, href: `/blog/${article.slug}` })}`;
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${appName} — ${t('indexTitle')}`)}</title>
    <link>${channelLink}</link>
    <description>${escapeXml(t('indexDescription'))}</description>
    <language>${locale}</language>
    <atom:link href="${base}/blog/rss/${locale}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
