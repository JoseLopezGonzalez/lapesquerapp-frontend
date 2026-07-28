import type { Metadata } from 'next';
import type { ComponentPropsWithoutRef } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Waves } from 'lucide-react';
import { Link, getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { appName, metadataBaseUrl, ogImagePath } from '@/configs/branding';
import { getAllBlogSlugs, getArticleBySlug } from '@/lib/blog/blogRepository';
import ClusterBadge from '@/components/LandingPage/blog/ClusterBadge';
import AuthorByline from '@/components/LandingPage/blog/AuthorByline';
import { blogAuthor } from '@/lib/blog/blogAuthor';
import type { BlogLocale } from '@/types/blog';

const DATE_LOCALES: Record<string, string> = { es: 'es-ES', pt: 'pt-PT', en: 'en-US' };

// Overrides mínimos de Markdown → tokens semánticos del proyecto (sin plugin de tipografía,
// ver GAP-123 Restricciones — sin dependencias nuevas).
const markdownComponents = {
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-foreground mt-8 mb-3 text-2xl font-semibold" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-foreground mt-6 mb-2 text-xl font-semibold" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="text-foreground mb-4 text-base leading-relaxed" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="text-foreground mb-4 ml-5 list-disc space-y-2" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="text-foreground mb-4 ml-5 list-decimal space-y-2" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-foreground underline underline-offset-4" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="text-foreground font-semibold" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="border-border text-muted-foreground my-4 border-l-4 pl-4 italic"
      {...props}
    />
  ),
};

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(locale as BlogLocale, slug);
  const base = metadataBaseUrl.replace(/\/$/, '');
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}${getPathname({ locale: l, href: `/blog/${slug}` })}`])
  );

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `${base}${getPathname({ locale, href: `/blog/${slug}` })}`,
      languages,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  // Requerido con generateStaticParams (next-intl): sin esto, getTranslations() ambiental
  // puede caer al locale por defecto en algunas requests (bug descubierto en GAP-123).
  setRequestLocale(locale);
  const article = getArticleBySlug(locale as BlogLocale, slug);
  const t = await getTranslations('Blog');
  const dateLocale = DATE_LOCALES[locale] ?? 'es-ES';
  const formattedDate = new Date(article.publishedAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const base = metadataBaseUrl.replace(/\/$/, '');

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    author: { '@type': 'Person', name: blogAuthor.name },
    // Portada real pendiente (placeholder Tipo 3) — se usa el OG image general del sitio
    // hasta que exista el asset final, ver landing-context.md §7b.
    image: `${base}${ogImagePath}`,
  };

  return (
    <div className="bg-background min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <header className="border-border border-b">
        <div className="container mx-auto flex items-center gap-2 px-4 py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-2">
              <Waves className="text-primary-foreground h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-foreground text-lg font-bold">{appName}</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-prose px-4 py-16">
        <Link href="/blog" className="text-muted-foreground hover:text-foreground text-sm">
          {t('backToBlog')}
        </Link>

        <ClusterBadge cluster={article.cluster} />
        <h1 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <AuthorByline />
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>

        <div className="mt-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {article.body}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
