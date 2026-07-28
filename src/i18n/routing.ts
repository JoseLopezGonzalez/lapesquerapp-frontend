import { defineRouting } from 'next-intl/routing';

// 'es' sin prefijo (locale por defecto), 'pt'/'en' con prefijo — Fase C ya tiene
// contenido traducido real para los 3 locales (ver src/messages/{locale}/landing.json).
export const routing = defineRouting({
  locales: ['es', 'pt', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});
