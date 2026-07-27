import type { MetadataRoute } from 'next';
import { metadataBaseUrl } from '@/configs/branding';

export default function robots(): MetadataRoute.Robots {
  const base = metadataBaseUrl.replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Capa defensiva: estas rutas viven detrás de subdominios de tenant y RBAC,
      // no deberían ser alcanzables por el crawler, pero se bloquean explícitamente
      // por si acaso (landing-context.md §4.4).
      disallow: [
        '/api/',
        '/admin',
        '/comercial',
        '/operator',
        '/field',
        '/production',
        '/warehouse',
        '/superadmin',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
