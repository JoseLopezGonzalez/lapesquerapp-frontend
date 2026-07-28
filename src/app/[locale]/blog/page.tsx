import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { metadataBaseUrl } from '@/configs/branding';
import { getArticleSummaries } from '@/lib/blog/blogRepository';
import ArticleCard from '@/components/LandingPage/blog/ArticleCard';
import type { BlogLocale } from '@/types/blog';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Blog' });
  const base = metadataBaseUrl.replace(/\/$/, '');
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}${getPathname({ locale: l, href: '/blog' })}`])
  );

  return {
    title: t('indexTitle'),
    description: t('indexDescription'),
    alternates: { canonical: `${base}${getPathname({ locale, href: '/blog' })}`, languages },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Requerido con generateStaticParams (next-intl): sin esto, getTranslations() ambiental
  // puede caer al locale por defecto en algunas requests (bug descubierto en GAP-123).
  setRequestLocale(locale);
  const t = await getTranslations('Blog');
  const articles = getArticleSummaries(locale as BlogLocale);

  return (
    <div className="bg-background min-h-screen py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            {t('indexTitle')}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">{t('indexDescription')}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              locale={locale}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
