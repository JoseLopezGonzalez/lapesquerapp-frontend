import type { BlogFrontmatter, BlogLocale } from '@/types/blog';

export const meta: Record<BlogLocale, BlogFrontmatter> = {
  es: {
    title:
      'Gestión de compras en lonja: cómo controlar precios, documentación y proveedores sin perder tiempo',
    description:
      'Qué documentos genera cada compra en lonja, por qué transcribirlos a mano cuesta margen y tiempo, y cómo conectar lonjas, proveedores y maquiladores en un solo sistema.',
    publishedAt: '2026-07-28',
    cluster: 'lonjas-compras',
    coverPlaceholderLabel:
      'Tarjeta de subasta de lonja con icono de mazo/precio y un icono de documento, evocando compras y documentación de mercado',
  },
  pt: {
    title:
      'Gestão de compras em lota: como controlar preços, documentação e fornecedores sem perder tempo',
    description:
      'Que documentos gera cada compra em lota, porque transcrevê-los à mão custa margem e tempo, e como ligar lotas, fornecedores e produção subcontratada num único sistema.',
    publishedAt: '2026-07-28',
    cluster: 'lonjas-compras',
    coverPlaceholderLabel:
      'Cartão de leilão de lota com ícone de martelo/preço e um ícone de documento, evocando compras e documentação de mercado',
  },
  en: {
    title:
      'Fish Market Purchasing Management: How to Control Prices, Documentation, and Suppliers Without Wasting Time',
    description:
      'What documents each fish market purchase generates, why manual transcription costs margin and time, and how to connect fish markets, suppliers, and toll processors in one system.',
    publishedAt: '2026-07-28',
    cluster: 'lonjas-compras',
    coverPlaceholderLabel:
      'Fish market auction card with a gavel/price icon and a document icon, evoking purchasing and market documentation',
  },
};
