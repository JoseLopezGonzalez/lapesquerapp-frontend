import type { BlogFrontmatter, BlogLocale } from '@/types/blog';

export const meta: Record<BlogLocale, BlogFrontmatter> = {
  es: {
    title: 'Etiquetado de productos pesqueros: qué exige la normativa y los errores más comunes',
    description:
      "Los datos obligatorios en la etiqueta de pescado y marisco, por qué se olvida la mención \"descongelado\", y cómo evitar los errores de etiquetado más frecuentes.",
    publishedAt: '2026-07-28',
    cluster: 'etiquetado-normativa',
    coverPlaceholderLabel:
      'Mockup de etiqueta con badge de check y un pequeño icono de documento normativo, evocando cumplimiento legal de etiquetado',
  },
  pt: {
    title: 'Rotulagem de produtos da pesca: o que exige a regulamentação e os erros mais comuns',
    description:
      "Os dados obrigatórios no rótulo de peixe e marisco, porque se esquece a menção \"descongelado\", e como evitar os erros de rotulagem mais frequentes.",
    publishedAt: '2026-07-28',
    cluster: 'etiquetado-normativa',
    coverPlaceholderLabel:
      'Mockup de rótulo com selo de check e um pequeno ícone de documento normativo, evocando conformidade legal de rotulagem',
  },
  en: {
    title: 'Labeling Fishery Products: What the Regulation Requires and the Most Common Mistakes',
    description:
      "The mandatory data on fish and seafood labels, why the \"thawed\" indication gets forgotten, and how to avoid the most common labeling mistakes.",
    publishedAt: '2026-07-28',
    cluster: 'etiquetado-normativa',
    coverPlaceholderLabel:
      'Product label mockup with a checkmark badge and a small regulation document icon, evoking legal labeling compliance',
  },
};
