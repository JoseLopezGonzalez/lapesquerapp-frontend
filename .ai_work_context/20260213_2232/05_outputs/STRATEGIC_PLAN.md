# Plan estratégico — Rendimiento PesquerApp

**Fecha**: 2026-02-13  
**Sesión**: 20260213_2232

---

## 1. Quick wins (1–2 días)

| # | Acción | Archivos | Impacto | Estado |
|---|--------|----------|---------|--------|
| 1 | ~~Envolver `console.log` o usar logger~~ | useStore.js, fetchWithTenant.js, SettingsContext.js, next.config (removeConsole) | Medio | **✅ Implementado** — `src/lib/logger.js` + removeConsole |
| 2 | Añadir `dynamic(ssr: false)` para Orquestador y Market Data Extractor | app/admin/orquestador, app/admin/market-data-extractor | Medio — reduce bundle inicial en rutas principales | Pendiente |
| 3 | Configurar `compress: true` y headers de caché en next.config.mjs | next.config.mjs | Bajo–Medio | Pendiente |
| 4 | ~~Reducir o eliminar setInterval de SettingsProvider~~ | SettingsContext.js | Bajo | **✅ Implementado** — visibilitychange + focus |
| 5 | Añadir `reactStrictMode: true` si no está (verificar) | next.config.mjs | Bajo (detección de efectos secundarios) | Pendiente |

---

## 2. Mejoras estructurales (1–2 semanas)

| # | Acción | Esfuerzo | Impacto | Riesgo |
|---|--------|----------|---------|--------|
| 1 | Introducir SWR o React Query para EntityClient, useStores, useStore, useOrder | Alto | Alto — caché, deduplicación, menos re-fetch | Medio — requiere refactor de hooks |
| 2 | Optimizar validación de token en middleware: cachear resultado 60–120 s por usuario o validar en background | Medio | Alto — reduce TTFB en navegaciones | Medio — cambiar semántica de seguridad |
| 3 | Lazy load de recharts: cargar solo cuando se muestran gráficos | Bajo | Medio | Bajo |
| 4 | Lazy load de xlsx/jspdf: cargar solo en flujos de exportación | Bajo | Medio | Bajo |
| 5 | Evaluar sustitución de @nextui-org por componentes ya usados (shadcn) para reducir duplicación de estilos | Medio | Medio | Medio |

---

## 3. Refactorizaciones estratégicas (2–4 semanas)

| # | Acción | Descripción |
|---|--------|-------------|
| 1 | Separar landing de login por ruta | Ruta `/` estática para landing; `/login` o tenant como entrada de app. Middleware redirige según host. |
| 2 | Migrar vistas de solo lectura a Server Components | Listados de entidades, dashboards de métricas estáticas, etc. Fetch en servidor, pasar datos como props. |
| 3 | Implementar paginación/virtualización en useStore | Evitar cargar todos los pallets de una vez; cargar por viewport o páginas. |
| 4 | Auditoría de dependencias | Analizar con `npx bundlewatch` o similar; identificar duplicados y alternativas más ligeras. |

---

## 4. Cambios arquitectónicos a medio plazo (1–3 meses)

| # | Acción | Descripción |
|---|--------|-------------|
| 1 | API Routes como BFF para prefetch | Crear rutas que llamen al backend Laravel y devuelvan datos; Server Components los consumen. |
| 2 | Streaming con Suspense | Encapsular secciones que dependen de fetch en Suspense; mostrar skeletons mientras cargan. |
| 3 | Edge runtime para middleware | Evaluar si el middleware puede ejecutarse en Edge para reducir latencia (con restricciones de fetch). |
| 4 | PWA y Service Worker para caché de assets | Ya hay SW para PWA; revisar estrategia de caché para API y assets estáticos. |

---

## 5. Priorización recomendada

1. **Semana 1**: Quick wins 2, 3, 5 (1 y 4 ya implementados).
2. **Semanas 2–3**: Introducir SWR/React Query en EntityClient y useStores; optimizar middleware.
3. **Mes 1**: Lazy load de recharts/xlsx; separar landing; primeras migraciones a Server Components.
4. **Meses 2–3**: Refactor completo de fetching; evaluación de Edge y BFF.
