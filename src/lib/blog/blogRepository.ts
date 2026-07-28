// Repositorio server-only del blog — usa `fs`/`path` de Node, nunca importar desde un Client
// Component. Los 3 artículos de lanzamiento son un registro estático (mismo patrón que
// TIER_KEYS/FAQ_KEYS en pricing/page.tsx) — no hace falta escanear el directorio en runtime.
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import type { BlogArticle, BlogArticleSummary, BlogFrontmatter, BlogLocale } from '@/types/blog';
import { meta as trazabilidadMeta } from '@/content/blog/trazabilidad-industria-pesquera/meta';
import { meta as lonjasComprasMeta } from '@/content/blog/gestion-lonjas-compras/meta';
import { meta as etiquetadoMeta } from '@/content/blog/etiquetado-normativa-pesca/meta';

const ARTICLES_META: Record<string, Record<BlogLocale, BlogFrontmatter>> = {
  'trazabilidad-industria-pesquera': trazabilidadMeta,
  'gestion-lonjas-compras': lonjasComprasMeta,
  'etiquetado-normativa-pesca': etiquetadoMeta,
};

export function getAllBlogSlugs(): string[] {
  return Object.keys(ARTICLES_META);
}

export function getArticleSummaries(locale: BlogLocale): BlogArticleSummary[] {
  return getAllBlogSlugs()
    .map((slug) => ({ slug, ...ARTICLES_META[slug][locale] }))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getArticleBySlug(locale: BlogLocale, slug: string): BlogArticle {
  const frontmatterByLocale = ARTICLES_META[slug];
  if (!frontmatterByLocale) {
    notFound();
  }

  const filePath = path.join(process.cwd(), 'src/content/blog', slug, `${locale}.md`);
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const body = fs.readFileSync(filePath, 'utf-8');
  return { slug, ...frontmatterByLocale[locale], body };
}
