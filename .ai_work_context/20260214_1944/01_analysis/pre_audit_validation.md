# Pre-auditoría — Validación y contexto

**Estado**: Completado  
**Última actualización**: 2026-02-14

## 1. Estructura del proyecto accesible

Sí. Proyecto en `/home/jose/brisapp-nextjs` con:

- **Raíz**: `package.json`, `next.config.mjs`, `tailwind.config.js`, `components.json`, `src/`, `docs/`, `public/`
- **App**: `src/app/` (App Router), `src/components/`, `src/context/`, `src/hooks/`, `src/lib/`, `src/services/`, `src/helpers/`, `src/configs/`, `src/middleware.js`
- **Rutas**: `app/page.js`, `app/admin/`, `app/auth/`, `app/warehouse/`, `app/api/`

## 2. Patrones arquitectónicos detectados

| Área | Patrón detectado |
|------|------------------|
| **Router** | App Router (Next.js 16). Uso de `layout.js`, `page.js`, `loading.js`, `error.js`, `not-found.js`. |
| **Server vs Client** | Muchos archivos con `"use client"` (~230+). Páginas que delegan en componentes cliente (ej. `AdminLayoutClient.jsx`, `OrderClient.js`, `ProductionClient.js`). |
| **Data fetching** | Sin React Query ni SWR en dependencias directas. Uso de `fetchWithTenant` (lib) + capa de servicios (`entityService`, `storeService`, etc.) y `apiRequest` en `lib/api/apiHelpers.js`. Fetch manual en componentes/servicios. |
| **Multi-tenant** | Cabecera `X-Tenant` inyectada en `fetchWithTenant` (servidor: `headers().host`; cliente: `window.location.host`). Utilidad `getCurrentTenant()`. Middleware valida token con tenant. |
| **Formularios** | `react-hook-form` + `zod` en `package.json`. Validación y manejo de formularios vía estas librerías. |
| **Estado** | Context API: `SettingsContext`, `BottomNavContext`, `OptionsContext`, `OrderContext`, `StoreContext`, `ProductionRecordContext`, `LogoutContext`, `OrdersManagerOptionsContext`, `RawMaterialReceptionsOptionsContext`. No Zustand/Redux. |
| **API** | Cliente centralizado: `fetchWithTenant` + `apiRequest`. Rutas API Next: `api/auth/[...nextauth]`, `api/submit-entity`, `api/chat`. Backend Laravel (API_URL_V2). |
| **UI** | shadcn/ui (Radix, `components.json` style "new-york", `tsx: false`). Componentes en `src/components/ui/`. También NextUI, Headless UI, Lucide, Recharts. |
| **Lenguaje** | JavaScript (`.js`/`.jsx`). Sin TypeScript en código fuente; `components.json` con `tsx: false`. |
| **Tests** | Pocos: `src/__tests__/helpers/*.test.js`, `src/app/home/page.test.js`. Sin librería de testing visible en `package.json` (solo eslint). |

## 3. Tech stack resumido

| Elemento | Tecnología |
|----------|------------|
| Framework | Next.js ^16.0.7 |
| React | 19.0.0-rc |
| Router | App Router |
| Data fetching | Manual (fetchWithTenant + servicios), sin React Query/SWR |
| Formularios | react-hook-form, zod |
| Estado global | Context API (múltiples contextos) |
| API / tenant | fetchWithTenant (X-Tenant), apiRequest, middleware con validación por tenant |
| UI | shadcn/ui (Radix), NextUI, Tailwind, Lucide |
| Lenguaje | JavaScript (JS/JSX) |
| Testing | 3 archivos test (helpers + 1 página), sin Jest/Vitest en dependencies |

## 4. Aclaraciones / patrones ambiguos

- **Nombre del proyecto**: En el prompt figura "PesquerApp"; en `package.json` el nombre es "brisapp-nextjs". Se asume mismo producto (ERP pesquero) y se usará PesquerApp en la auditoría.
- **React Query**: El documento `docs/prompts/02_Nextjs frontend evolution prompt.md` exige React Query; el código actual no lo usa. La auditoría describirá el estado actual (fetch manual/servicios) y lo contrastará con buenas prácticas.
- **TypeScript**: No adoptado; la auditoría evaluará el uso de tipos implícitos y riesgos de tipo.

No hay más ambigüedades críticas que impidan la auditoría profunda.

## 5. Confirmación para proceder

Una vez validado este pre-auditoría, se procederá a:

1. Auditoría completa según las secciones del prompt (resumen ejecutivo, identidad arquitectónica, fortalezas, riesgos, patrones estructurales Next.js/React, componentes, data fetching, estado, UI, TypeScript, rendimiento, testing, accesibilidad, seguridad, mejoras, evolución).
2. Documentos en `docs/audits/`: `nextjs-frontend-global-audit.md` y en `docs/audits/findings/`: multi-tenancy, arquitectura de componentes, data fetching, state management, UI/design system, y opcionalmente structural-patterns.
3. Framework de madurez (1–10 por dimensión) y entregables finales (top 5 riesgos, top 5 mejoras, puntuación global).

**¿Confirmas que proceda con la auditoría completa?**
