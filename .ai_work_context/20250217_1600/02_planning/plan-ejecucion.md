# Plan de ejecución

**Estado**: Completado  
**Última actualización**: 2025-02-17

## Orden de trabajo

1. Crear módulo `src/configs/branding.js` y exportar API (isGenericBranding, appName, appShortName, metadataBase, supportEmail, demoEmail, exampleEmail, baseDomain, logoAlt, demoUrl, infoEmail, manifest*, apiBaseUrl).
2. Añadir en `.env.example` variable `NEXT_PUBLIC_APP_BRANDING` (comentario y nombre).
3. Sustituir referencias en `layout.js` (metadata y meta PWA).
4. Sustituir en componentes Login y Landing.
5. Sustituir en PWA (InstallPromptBanner, InstallGuideIOS).
6. Ajustar config.js, useLoginTenant, page.js (baseDomain), Chat (comentario), Navbar (alt).
7. Implementar landing no visible en modo genérico (redirección en page.js).
8. Manifest: API route que devuelve JSON desde branding; layout apunta `<link rel="manifest" href="/api/manifest" />` o similar.
9. Documentación en `docs/guia-branding-generico-env.md` e índice si existe.

## Checklist (resumen)

- [ ] branding.js creado y usado en todos los puntos
- [ ] layout.js metadata y apple-mobile-web-app-title
- [ ] config.js fallback desde branding
- [ ] Manifest por API route
- [ ] Login (4 componentes)
- [ ] PWA (InstallPromptBanner, InstallGuideIOS)
- [ ] Landing (textos + enlaces) y comportamiento genérico (no mostrar landing)
- [ ] useLoginTenant demoEmail, page.js baseDomain
- [ ] Chat comentario, Navbar alt
- [ ] docs/guia-branding-generico-env.md
