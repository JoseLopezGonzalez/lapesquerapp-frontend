# Informe final: implementación branding genérico por .env

**Sesión**: `.ai_work_context/20250217_1600/`  
**Fecha**: 2025-02-17  
**Prompt**: `docs/prompts/13-implementacion-branding-generico-env.md`

---

## Resumen ejecutivo

Se implementó un sistema único de branding alimentado por `NEXT_PUBLIC_APP_BRANDING` que permite alternar entre modo genérico (textos neutros, landing no accesible) y modo La PesquerApp (identidad completa). Toda la lógica y cadenas relevantes leen del módulo de config `src/configs/branding.js`.

---

## Objetivos cumplidos

- Interruptor por .env: `NEXT_PUBLIC_APP_BRANDING` = `generic` | `pesquerapp`.
- Módulo de config único exportando: isGenericBranding, appName, appShortName, metadataBaseUrl, baseDomain, supportEmail, demoEmail, exampleEmail, infoEmail, demoUrl, logoAlt, apiBaseUrlFallback, manifestName, manifestShortName, manifestDescription.
- Layout, login, landing, PWA, hooks y página raíz consumen solo ese módulo.
- En modo genérico la landing no es accesible (raíz muestra login).
- Manifest PWA servido por API route `/api/manifest`.

---

## Deliverables

- **Código**: `src/configs/branding.js`, `src/app/api/manifest/route.js`; cambios en layout.js, config.js, page.js, componentes Login (4), PWA (2), LandingPage, useLoginTenant, Chat, Navbar.
- **Documentación**: `docs/guia-branding-generico-env.md` (descripción del sistema, instrucciones de uso, ubicación); entrada en `docs/00-docs-map.md`.
- **Config**: `.env.example` ya incluye comentario y variable `NEXT_PUBLIC_APP_BRANDING`.

---

## Decisiones y validaciones

- Landing en modo genérico: opción A (raíz muestra login).
- Manifest: API route `src/app/api/manifest/route.js`.
- Config API: fallback solo en modo pesquerapp.

---

## Advertencias

- En modo genérico sin `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL`, la URL de API queda vacía; configurar env en despliegue.
- `public/site.webmanifest` sigue existiendo; el layout usa `/api/manifest`. Se puede eliminar el estático si se desea.

---

## Próximos pasos sugeridos

- Probar con `NEXT_PUBLIC_APP_BRANDING=generic` y `pesquerapp` en local y en despliegue.
- Mantener nuevos textos/dominios de marca en `src/configs/branding.js`.

---

**Fin del informe.**
