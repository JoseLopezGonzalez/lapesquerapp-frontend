# Análisis: alcance y archivos

**Estado**: Completado  
**Última actualización**: 2025-02-17

## Fuente

- Prompt: `docs/prompts/13-implementacion-branding-generico-env.md`
- Auditoría: `docs/audits/auditoria-nombre-app-la-pesquerapp.md` — **solo sección 1** (código y configuración).

## Archivos en alcance (según auditoría sección 1)

| Área | Archivo | Cambios |
|------|---------|---------|
| Layout/metadatos | `src/app/layout.js` | metadata (title, template, metadataBase, openGraph, twitter), apple-mobile-web-app-title |
| Config API | `src/configs/config.js` | Comentario y fallback API URL desde branding |
| PWA manifest | `public/site.webmanifest` | Servir por API route que lee branding (opción B) |
| Login | `LoginFormMobile.tsx`, `LoginFormDesktop.tsx`, `LoginFormContent.tsx`, `LoginWelcomeStep.tsx` | appName, supportEmail, exampleEmail placeholder |
| PWA UI | `InstallPromptBanner.jsx`, `InstallGuideIOS.jsx` | appShortName en textos "Instala(r) PesquerApp" |
| Landing | `LandingPage/index.js` | h1, demo URL, footer (nombre, infoEmail, ©) |
| Lógica | `useLoginTenant.ts`, `src/app/page.js` | demoEmail, baseDomain |
| Comentario/alt | `Chat/index.js`, `Admin/Layout/Navbar/index.js` | Comentario genérico, logoAlt |

## Fuera de alcance

- Documentación (`docs/`, `README.md`, `.ai_standards`) — excepto el entregable obligatorio `docs/guia-branding-generico-env.md` (o similar).
- `package.json` (campo `name`).
- Archivos listados **solo** en sección 2 de la auditoría.

## Decisión landing modo genérico

**Opción A**: Redirigir ruta raíz `/` al login cuando branding es genérico (y no hay sesión). Implementado en `src/app/page.js`: si `isGenericBranding` y no subdominio → redirigir a login o página mínima; la raíz no mostrará `<LandingPage />`.
