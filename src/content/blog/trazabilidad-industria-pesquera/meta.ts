import type { BlogFrontmatter, BlogLocale } from '@/types/blog';

export const meta: Record<BlogLocale, BlogFrontmatter> = {
  es: {
    title: 'Trazabilidad en la industria pesquera: qué exige la normativa y cómo llevarla sin hojas de cálculo',
    description:
      'Qué datos exige la trazabilidad pesquera en cada lote, cómo funciona hacia atrás y hacia delante, y por qué fallan las hojas de cálculo cuando hay que responder rápido.',
    publishedAt: '2026-07-28',
    cluster: 'trazabilidad',
    coverPlaceholderLabel:
      'Icono de pez conectado por línea punteada a un tag de lote y un check, evocando trazabilidad de la captura al producto final',
  },
  pt: {
    title:
      'Rastreabilidade na indústria da pesca: o que exige a regulamentação e como geri-la sem folhas de cálculo',
    description:
      'Que dados exige a rastreabilidade pesqueira em cada lote, como funciona para trás e para a frente, e porque falham as folhas de cálculo quando é preciso responder depressa.',
    publishedAt: '2026-07-28',
    cluster: 'trazabilidad',
    coverPlaceholderLabel:
      'Ícone de peixe ligado por linha pontilhada a uma etiqueta de lote e um check, evocando rastreabilidade da captura ao produto final',
  },
  en: {
    title:
      'Traceability in the Fishing Industry: What the Regulation Requires and How to Manage It Without Spreadsheets',
    description:
      'What data fishing traceability requires per batch, how backward and forward traceability works, and why spreadsheets fail when you need to respond fast.',
    publishedAt: '2026-07-28',
    cluster: 'trazabilidad',
    coverPlaceholderLabel:
      'Fish icon connected by a dotted line to a batch tag and a checkmark, evoking traceability from catch to final product',
  },
};
