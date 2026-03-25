# Auditoría: referencias al nombre de la aplicación "La PesquerApp"

**Fecha**: 2025-02-17  
**Origen**: `docs/prompts/12-app-name-la-pesquerapp-audit-report.md`  
**Restricción**: Solo documentación; no se ha modificado código.

---

## 1. Referencias en código y configuración (fuente de la aplicación)

### 1.1 Título del documento / pestaña del navegador y metadatos SEO

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `src/app/layout.js` (líneas 5-7) | nombre directo | pestaña / meta title | `default: "La PesquerApp \| ERP para...", template: "%s \| La PesquerApp"` | Sí — pestaña del navegador | Fácil de parametrizar por env o tenant |
| `src/app/layout.js` (líneas 11-22) | nombre directo / derivado | meta / SEO / Open Graph | `metadataBase: "https://lapesquerapp.es"`, `openGraph.title`, `siteName: "La PesquerApp"`, `url: "https://lapesquerapp.es"`, `alt: "La PesquerApp - ERP..."` | Sí — redes, búsqueda, vista previa | Centralizado en metadata; dominio hardcodeado |
| `src/app/layout.js` (líneas 27-31) | nombre directo | Twitter card | `title: "La PesquerApp \| El ERP del sector pesquero"`, `description` con "ERP" | Sí — Twitter preview | Mismo bloque metadata |
| `src/app/layout.js` (línea 46) | derivado/identificador | meta PWA iOS | `apple-mobile-web-app-title" content="PesquerApp"` | Sí — nombre al instalar PWA en iOS | Branding PWA |

### 1.2 Configuraciones de la aplicación

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `src/configs/config.js` (líneas 1, 5-6) | derivado/identificador | config API | Comentario "producción: https://api.lapesquerapp.es"; fallback `'https://api.lapesquerapp.es'` | No (solo URL de API) | Fallback hardcodeado; parametrizable por env |
| `.env.example` (líneas 23, 6-9, 19, 23-24) | derivado/identificador | variables de entorno | Comentarios y ejemplo `NEXT_PUBLIC_API_BASE_URL=https://api.lapesquerapp.es`, `NEXT_PUBLIC_API_URL` | No | Documentación de env; no expone nombre de app en UI |
| `public/site.webmanifest` | nombre directo / branding | PWA manifest | `"name":"La PesquerApp ERP","short_name":"PesquerApp"`, `"description":"ERP diseñado para empresas pesqueras..."` | Sí — nombre al instalar PWA, diálogos "Añadir a pantalla" | Recurso estático; clave para PWA |
| `package.json` (línea 2) | derivado/identificador | nombre de proyecto | `"name": "brisapp-nextjs"` | No (solo repo/build) | Identidad de repo; no "PesquerApp" literal |

### 1.3 Interfaz de usuario (UI) — textos visibles

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `src/components/LoginPage/LoginFormMobile.tsx` (líneas 54, 80, 118) | nombre directo / referencia indirecta | UI — login | "La PesquerApp"; `soporte@pesquerapp.com`; placeholder `ejemplo@lapesquerapp.es` | Sí — pantalla de login | Hardcodeado; email de soporte/ejemplo |
| `src/components/LoginPage/LoginFormDesktop.tsx` (líneas 57, 87, 123) | nombre directo / referencia indirecta | UI — login | "La PesquerApp"; `soporte@pesquerapp.com` | Sí — login escritorio | Mismo patrón que móvil |
| `src/components/LoginPage/LoginFormContent.tsx` (línea 79) | derivado/identificador | UI — placeholder | `placeholder="ejemplo@lapesquerapp.es"` | Sí — campo email | Identificador de dominio |
| `src/components/LoginPage/LoginWelcomeStep.tsx` (línea 70) | nombre directo | UI — bienvenida | Texto "La PesquerApp" | Sí — paso bienvenida login | Hardcodeado |
| `src/components/PWA/InstallPromptBanner.jsx` (líneas 67, 140) | nombre directo | UI — PWA | "Instala PesquerApp" | Sí — banner instalación | Strings duplicados |
| `src/components/PWA/InstallGuideIOS.jsx` (líneas 217, 271, 296) | nombre directo | UI — PWA | "Instalar PesquerApp" | Sí — guía instalación iOS | Varias apariciones |
| `src/components/LandingPage/index.js` (líneas 29, 40, 422, 434, 445) | nombre directo / derivado | UI — landing | "La PesquerApp" (h1); "Ver demo" → `test.lapesquerapp.es`; footer "La Pesquerapp", `info@lapesquerapp.es`, "© 2025 La PesquerApp" | Sí — landing y footer | Dominio y nombre en varios puntos |

### 1.4 Código y comentarios (strings, mensajes, identificadores)

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `src/hooks/useLoginTenant.ts` (línea 33) | derivado/identificador | string en código | `setDemoEmail("admin@lapesquerapp.es")` | Sí — en modo demo (email prefijado) | Identificador dominio |
| `src/app/page.js` (línea 29) | derivado/identificador | lógica | `const baseDomain = "lapesquerapp.es"` | No (uso interno para redirección/tenant) | Hardcodeado; usado para detección de entorno |
| `src/components/AI/Chat/index.js` (línea 6) | referencia indirecta | comentario | "Integrado en La PesquerApp para proporcionar asistencia mediante AI." | No | Comentario; fácil de neutralizar |

### 1.5 Recursos estáticos y branding

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `src/app/layout.js` (líneas 33-36) | branding | íconos | `icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" }`, `manifest: "/site.webmanifest"` | Sí — favicon, pantalla de inicio | Rutas genéricas; contenido de íconos no auditado en binario |
| `public/site.webmanifest` | branding | PWA | Ver 1.2 | Sí | Nombre mostrado al instalar |

### 1.6 Referencias a dominio / producto (sin nombre literal "La PesquerApp")

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `src/components/Admin/Layout/Navbar/index.js` (línea 73) | referencia indirecta | branding | `alt="BlueApp"` (logo) | Sí — cabecera admin | Marca relacionada (BlueApp/PesquerApp) |

---

## 2. Documentación (docs/)

Incluye solo archivos que nombran la aplicación, el dominio o identificadores; se omiten sesiones `.ai_work_context`.

| Ubicación | Clase | Tipo | Contexto | Visibilidad | Notas |
|-----------|--------|------|----------|-------------|--------|
| `docs/00-overview-introduction.md` | nombre directo / referencia indirecta | doc | "Brisapp", "BlueApp/PesquerApp", "https://api.lapesquerapp.es/api/" | Sí — quien lea docs | Intro del proyecto |
| `docs/01-architecture-app-router.md` | derivado | doc | "brisamar.lapesquerapp.es", "brisamar.localhost", tenant por host | Sí | Arquitectura multi-tenant |
| `docs/02-project-structure.md` | derivado | doc | `API_URL = 'https://api.lapesquerapp.es/api/'`, `COMPANY_NAME` (Brisamar) | Sí | Estructura y ejemplos |
| `docs/11-autenticacion-autorizacion.md` | derivado | doc | `NEXT_PUBLIC_API_BASE_URL`, branding por subdominio | Sí | Auth |
| `docs/12-utilidades-helpers.md` | derivado | doc | Ejemplo tenant `brisamar` | Sí | Helpers |
| `docs/16-guia-auth-magic-link-otp.md` | derivado | doc | `https://{subdominio}.lapesquerapp.es/auth/verify?token=...` | Sí | Flujo auth |
| `docs/20-project-implementation-details.md` | derivado | doc | `NEXT_PUBLIC_API_URL`, fallback `https://api.lapesquerapp.es`, "brisamar.lapesquerapp.es" | Sí | Detalles de implementación |
| `docs/52-implementacion-auth-transition-screen.md` | nombre directo / branding | doc | "La PesquerApp", "Logo de La PesquerApp", "Nombre: La PesquerApp (configurable)" | Sí | Especificación de pantalla de transición |
| `docs/troubleshooting/00-cors-auth-production.md` | derivado | doc | Múltiples URLs "brisamar.lapesquerapp.es", "api.lapesquerapp.es" | Sí | CORS producción |
| `docs/analisis/03-analisis-orders-manager.md` | derivado | doc | "brisamar.lapesquerapp.es" | Sí | Análisis |
| `docs/audits/nextjs-evolution-log.md` | referencia indirecta | doc | "PesquerApp" (frontend) | Sí | Log de evolución |
| `docs/audits/nextjs-frontend-global-audit.md` | nombre directo | doc | "PesquerApp (brisapp-nextjs)" | Sí | Auditoría global |
| `docs/audits/findings/structural-patterns-usage.md` | nombre directo | doc | "PesquerApp" | Sí | Hallazgos |
| `docs/chat-ai/README.md` | nombre directo | doc | "La PesquerApp" (Chat AI) | Sí | README módulo |
| `docs/mobile-app/README.md` | nombre directo | doc | "PesquerApp", "PWA de PesquerApp" | Sí | Mobile |
| `docs/mobile-app/implementacion/01-master-implementacion-mobile-pesquerapp.md` | nombre directo / derivado | doc | "PESQUERAPP", "PesquerApp", "apple-mobile-web-app-title PesquerApp" | Sí | Implementación mobile |
| `docs/mobile-app/estandares-ui/01-pilares-ui-nativa-mobile.md` | nombre directo | doc | "PesquerApp" (varias) | Sí | Estándares UI |
| `docs/mobile-app/estandares-ui/02-tipologias-pantallas-entidades-vs-gestores.md` | nombre directo | doc | "PesquerApp" | Sí | Tipologías |
| `docs/mobile-app/analisis/01-analisis-gestor-pedidos-mobile.md` | nombre directo | doc | "PesquerApp" | Sí | Análisis pedidos |
| `docs/prompts/01-nextjs-frontend-audit-prompt.md` | nombre directo | doc | "Project name: PesquerApp" | Sí | Prompt |
| `docs/prompts/02-nextjs-frontend-evolution-prompt.md` | nombre directo | doc | "PesquerApp", "Multi-tenant Next.js SaaS ERP (PesquerApp)" | Sí | Prompt |
| `docs/prompts/09-docs-(orden-invertido)-nextjs.md` | nombre directo | doc | "Frontend PesquerApp" | Sí | Prompt |
| `docs/prompts/auditoria-rendimiento.md` | nombre directo | doc | "Frontend de PesquerApp" | Sí | Prompt |
| `docs/prompts/transito/implementacion vista orquestador produccion/01-flujo-login-operario-dashboard.md` | derivado | doc | "brisamar.lapesquerapp.es" | Sí | Flujo login |
| `docs/prompts/transito/implementacion vista orquestador produccion/02-doc.md` | nombre directo | doc | "# PesquerApp" | Sí | Doc tránsito |
| `docs/migraciones-expo/02-manejo-sesiones-login-expo.md` | derivado / nombre directo | doc | "admin@lapesquerapp.es", branding, "La PesquerApp" | Sí | Migración Expo |
| `README.md` (raíz) | referencia indirecta | doc | "BrisApp", "BlueApp/PesquerApp", "brisapp-nextjs" | Sí — repo | Identidad del repo |
| `.ai_standards/README.md` | nombre directo | doc | "PesquerApp Backend" | Sí | Estándares IA |
| `.ai_standards/AGENT_MEMORY_SYSTEM.md` | derivado | doc | "DOMAIN_RULES_PESQUERAPP.md", "proyecto_pesquerapp" | Sí | Sistema memoria |

---

## 3. Resumen cuantitativo

### Por clase

| Clase | Aproximado (referencias únicas significativas) |
|-------|-----------------------------------------------|
| Nombre directo | ~25 (layout, login, landing, PWA, manifest, docs) |
| Referencia indirecta | ~5 (dominios, emails, BlueApp, "la app") |
| Derivado/identificador | ~20 (lapesquerapp.es, api.lapesquerapp.es, env, baseDomain, tenant brisamar, package name) |
| Branding | ~8 (manifest, metadata, PWA title, íconos, logos) |

### Por tipo

| Tipo | Cantidad aproximada |
|------|---------------------|
| Pestaña del navegador / meta / SEO | 6 |
| Config / env | 5 |
| UI (login, landing, PWA) | 15+ |
| String o comentario en código | 4 |
| Recurso estático / manifest | 2 |
| Documentación | 30+ |

### Por visibilidad al usuario final

| Visibilidad | Observación |
|-------------|-------------|
| Sí (usuario final) | Título pestaña, Open Graph, login, landing, footer, PWA install, manifest name, emails (soporte, demo, info) |
| No (solo código/docs) | Fallbacks API, baseDomain, comentarios, package name, docs internas |

---

## 4. Recomendaciones breves (sin implementar)

- **Prioridad alta (visibilidad directa)**  
  - Parametrizar en un solo lugar (env o config por tenant): `metadata` en `src/app/layout.js` (title, template, siteName, metadataBase, openGraph, twitter), `public/site.webmanifest` (name, short_name), y meta `apple-mobile-web-app-title`.  
  - Unificar strings "La PesquerApp" / "Instala PesquerApp" en login, landing, PWA (i18n o constante desde config).

- **Prioridad media**  
  - Sustituir fallbacks de dominio (`lapesquerapp.es`, `api.lapesquerapp.es`) por variables de entorno sin valor por defecto identificable, o por detección de host.  
  - Emails de ejemplo/soporte (`soporte@pesquerapp.com`, `ejemplo@lapesquerapp.es`, `info@lapesquerapp.es`, `admin@lapesquerapp.es`) en config o env por tenant.

- **Prioridad baja (docs e identidad de repo)**  
  - Dejar para fase de "genericidad": README, docs en `docs/`, `.ai_standards`, nombres de proyecto (package.json, Vercel, etc.) cuando se decida nombre genérico o multi-tenant.

- **Neutralizar identidad antes de lanzar**  
  - Con el reporte anterior se puede: (1) extraer todas las cadenas a un módulo de branding/config, (2) alimentar ese módulo por env o por tenant, (3) revisar favicon/manifest/og-image si se quiere ocultar la marca hasta el release.

---

**Fin del reporte.** No se ha realizado ningún cambio en el código; solo búsqueda, listado y documentación.
