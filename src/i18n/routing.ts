import { defineRouting } from 'next-intl/routing';

// Solo 'es' está publicado por ahora (Fase B1). 'pt'/'en' se añaden en Fase C
// cuando exista contenido traducido real — evita rutas /pt, /en sin contenido.
export const routing = defineRouting({
  locales: ['es'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});
