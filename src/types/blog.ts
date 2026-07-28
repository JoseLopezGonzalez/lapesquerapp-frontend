export type BlogLocale = 'es' | 'pt' | 'en';

export type BlogCluster = 'trazabilidad' | 'lonjas-compras' | 'etiquetado-normativa';

export interface BlogFrontmatter {
  title: string;
  description: string;
  /** ISO 8601, ej. '2026-07-28' */
  publishedAt: string;
  cluster: BlogCluster;
  /** Descripción/prompt específico del placeholder Tipo 3 de portada (landing-context.md §7b) */
  coverPlaceholderLabel: string;
}

export interface BlogArticleSummary extends BlogFrontmatter {
  slug: string;
}

export interface BlogArticle extends BlogArticleSummary {
  body: string;
}
